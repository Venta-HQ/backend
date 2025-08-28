import { firstValueFrom } from 'rxjs';
import { Socket } from 'socket.io';
import { Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
} from '@nestjs/websockets';
import type { AuthenticatedSocket } from '@venta/apitypes';
import {
	UserLocationUpdateACL,
	userLocationUpdateSchema,
	type UserLocationUpdateRequest,
} from '@venta/domains/location-services/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { WsThrottlerGuard } from '@venta/nest/guards';
import { WsErrorInterceptor } from '@venta/nest/interceptors';
import { BaseWebSocketGateway, GrpcInstance, Logger, PresenceService } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { GEOLOCATION_SERVICE_NAME, GeolocationServiceClient } from '@venta/proto/location-services/geolocation';

@WebSocketGateway({
	namespace: 'user',
	cors: {
		origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
	},
})
@UseInterceptors(WsErrorInterceptor)
@UseGuards(WsThrottlerGuard)
export class UserLocationGateway extends BaseWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private buildVendorRoom(vendorId: string): string {
		return `vendor:${vendorId}`;
	}

	constructor(
		protected readonly logger: Logger,
		@Inject(GEOLOCATION_SERVICE_NAME) private client: GrpcInstance<GeolocationServiceClient>,
		protected readonly presence: PresenceService,
	) {
		super();
		this.logger.setContext(UserLocationGateway.name);
	}

	/**
	 * Handle new WebSocket connections
	 */
	async handleConnection(client: AuthenticatedSocket) {
		try {
			await this.handleConnectionStandard(client, 'user');
		} catch (error) {
			this.handleConnectionError(error, client, 'handle user connection');
		}
	}

	/**
	 * Handle WebSocket disconnections
	 */
	async handleDisconnect(client: Socket) {
		try {
			await this.handleDisconnectStandard(client, 'user');
		} catch (error) {
			this.logger.error('Failed to handle user disconnection', error instanceof Error ? error.stack : undefined, {
				socketId: client.id,
			});
		}
	}

	/**
	 * Handle user location updates - now with clean decorator-based validation!
	 */
	@SubscribeMessage('update_location')
	async handleLocationUpdate(
		@ConnectedSocket() socket: AuthenticatedSocket,
		@MessageBody(new SchemaValidatorPipe(userLocationUpdateSchema)) data: UserLocationUpdateRequest,
	) {
		try {
			this.logger.debug('handleLocationUpdate: start', { socketId: socket.id });
			// Use authenticated user id as source of truth (guarded at transport layer)
			const userId = (socket.user as any)?.id as string;
			// Consolidated TTL refresh via presence service
			await this.presence.touch('user', socket.id, (socket.user as any)?.id as string);

			// Transform validated data to domain object using ACL
			const locationUpdate = UserLocationUpdateACL.toDomain(data, userId);

			const { vendors: nearbyVendors } = await firstValueFrom(
				this.client.invoke('vendorLocations', {
					ne: locationUpdate.coordinates,
					sw: locationUpdate.coordinates,
				}),
			);

			// Join rooms for nearby vendors
			const nextRooms = new Set<string>(nearbyVendors.map((v) => this.buildVendorRoom(v.vendorId)));
			nextRooms.forEach((room) => socket.join(room));

			// Leave rooms for vendors that are no longer nearby (based on live socket rooms)
			const currentRooms = socket.rooms;
			currentRooms.forEach((room) => {
				if (room.startsWith('vendor:') && !nextRooms.has(room)) {
					socket.leave(room);
				}
			});

			// Notify user about successful update
			socket.emit('location_updated', {
				userId,
				location: {
					lat: locationUpdate.coordinates.lat,
					lng: locationUpdate.coordinates.lng,
				},
				nearbyVendors,
			});

			this.logger.debug('User location updated', { socketId: socket.id, userId });
		} catch (error) {
			this.logger.error('Failed to update user location', error instanceof Error ? error.stack : undefined, {
				socketId: socket.id,
			});

			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_user_location',
				socketId: socket.id,
			});
		}
	}
}

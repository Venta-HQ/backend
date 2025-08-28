import { Socket } from 'socket.io';
import { UseGuards, UseInterceptors } from '@nestjs/common';
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
	VendorLocationUpdateACL,
	vendorLocationUpdateSchema,
	type VendorLocationUpdateRequest,
} from '@venta/domains/location-services/contracts';
import type { LocationUpdate } from '@venta/domains/location-services/contracts/types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { WsThrottlerGuard } from '@venta/nest/guards';
import { WsErrorInterceptor } from '@venta/nest/interceptors';
import { BaseWebSocketGateway, EventService, Logger, PresenceService } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes';

@WebSocketGateway({
	namespace: 'vendor',
	cors: {
		origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
	},
})
@UseInterceptors(WsErrorInterceptor)
@UseGuards(WsThrottlerGuard)
export class VendorLocationGateway extends BaseWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		protected readonly logger: Logger,
		private readonly eventService: EventService,
		protected readonly presence: PresenceService,
	) {
		super();
		this.logger.setContext(VendorLocationGateway.name);
	}

	/**
	 * Handle new WebSocket connections
	 */
	async handleConnection(client: AuthenticatedSocket) {
		try {
			await this.handleConnectionStandard(client, 'vendor');
		} catch (error) {
			this.handleConnectionError(error, client, 'handle vendor connection');
		}
	}

	/**
	 * Handle WebSocket disconnections
	 */
	async handleDisconnect(client: Socket) {
		try {
			await this.handleDisconnectStandard(client, 'vendor', async (vendorId) => {
				this.getNamespace('/user').to(`vendor:${vendorId}`).emit('vendor_status_changed', {
					vendorId,
					isOnline: false,
				});
			});
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnection', error instanceof Error ? error.stack : undefined, {
				socketId: client.id,
			});
		}
	}

	/**
	 * Handle vendor location updates - now with clean decorator-based validation!
	 */
	@SubscribeMessage('update_location')
	async handleLocationUpdate(
		@ConnectedSocket() socket: AuthenticatedSocket,
		@MessageBody(new SchemaValidatorPipe(vendorLocationUpdateSchema)) data: VendorLocationUpdateRequest,
	) {
		try {
			// Use authenticated user id as source of truth (guarded at transport layer)
			const vendorId = (socket.user as any)?.id as string;
			// Consolidated TTL refresh via presence service
			await this.presence.touch('vendor', socket.id, (socket.user as any)?.id as string);

			// Transform validated data to domain object using ACL
			const locationUpdate: LocationUpdate = VendorLocationUpdateACL.toDomain(data, vendorId);

			// Update vendor location in geolocation service (fire-and-forget)
			// We don't need to block the WS handler on this operation; errors are logged asynchronously
			this.eventService.emit('location.vendor.location_update_requested', {
				vendorId,
				location: locationUpdate.coordinates,
				timestamp: new Date().toISOString(),
			});

			// Notify users in the vendor's room (user namespace) about location update
			this.getNamespace('/user')
				.to(`vendor:${vendorId}`)
				.emit('vendor_location_changed', {
					vendorId,
					location: {
						lat: locationUpdate.coordinates.lat,
						lng: locationUpdate.coordinates.lng,
					},
				});

			// Notify vendor about successful update
			socket.emit('location_updated', {
				vendorId,
				coordinates: {
					lat: locationUpdate.coordinates.lat,
					lng: locationUpdate.coordinates.lng,
				},
			});

			this.logger.debug('Vendor location updated', {
				socketId: socket.id,
				vendorId,
				location: locationUpdate.coordinates,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
			});

			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_vendor_location',
				socketId: socket.id,
			});
		}
	}
}

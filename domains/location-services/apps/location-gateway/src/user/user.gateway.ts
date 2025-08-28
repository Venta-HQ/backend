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
import { BaseWebSocketGateway, GrpcInstance, Logger } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { GEOLOCATION_SERVICE_NAME, GeolocationServiceClient } from '@venta/proto/location-services/geolocation';
import { UserConnectionManagerService } from './user.manager';

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
	protected readonly connectionManager = this.userConnectionManager;

	private buildVendorRoom(vendorId: string): string {
		return `vendor:${vendorId}`;
	}

	constructor(
		private readonly userConnectionManager: UserConnectionManagerService,
		protected readonly logger: Logger,
		@Inject(GEOLOCATION_SERVICE_NAME) private client: GrpcInstance<GeolocationServiceClient>,
	) {
		super();
		this.logger.setContext(UserLocationGateway.name);
	}

	/**
	 * Handle new WebSocket connections
	 */
	async handleConnection(client: AuthenticatedSocket) {
		try {
			// Validate connection using base class method
			const userId = this.validateConnection(client, 'User');
			if (!userId) return;

			// Register the user connection
			await this.userConnectionManager.registerUser(client.id, userId);

			// Log success using base class method
			this.logConnectionSuccess(client, userId, 'User');
		} catch (error) {
			// Handle error using base class method
			this.handleConnectionError(error, client, 'handle user connection');
		}
	}

	/**
	 * Handle WebSocket disconnections
	 */
	async handleDisconnect(client: Socket) {
		try {
			const connectionInfo = await this.userConnectionManager.getConnectionInfo(client.id);

			if (!connectionInfo) {
				this.logger.warn('User disconnection attempt without connection info', {
					socketId: client.id,
				});
				return;
			}

			// Get all vendor rooms this user is in before disconnecting
			const vendorRooms = await this.userConnectionManager.getUserVendorRooms(connectionInfo.userId);

			// Handle user disconnection
			await this.userConnectionManager.handleUserDisconnect(client.id, connectionInfo.userId);

			// Leave all vendor rooms
			vendorRooms.forEach((vendorId) => {
				client.leave(this.buildVendorRoom(vendorId));
			});

			// Log success using base class method
			this.logDisconnectionSuccess(client, 'User');
		} catch (error) {
			this.logger.error('Failed to handle user disconnection', error instanceof Error ? error.stack : undefined, {
				socketId: client.id,
			});
			// For disconnections, we don't throw - just log the error
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
			const userId = await this.userConnectionManager.getSocketUserId(socket.id);

			if (!userId) {
				this.logger.warn('Location update from unregistered user', {
					socketId: socket.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
			}

			// Transform validated data to domain object using ACL
			const locationUpdate = UserLocationUpdateACL.toDomain(data, userId);

			const { vendors: nearbyVendors } = await firstValueFrom(
				this.client.invoke('vendorLocations', {
					ne: locationUpdate.coordinates,
					sw: locationUpdate.coordinates,
				}),
			);

			// Join rooms for nearby vendors
			nearbyVendors.forEach((vendor) => {
				socket.join(this.buildVendorRoom(vendor.vendorId));
				this.userConnectionManager.addUserToVendorRoom(userId, vendor.vendorId);
			});

			// Get current vendor rooms
			const currentRooms = await this.userConnectionManager.getUserVendorRooms(userId);

			// Leave rooms for vendors that are no longer nearby
			currentRooms.forEach((vendorId) => {
				if (!nearbyVendors.some((vendor) => vendor.vendorId === vendorId)) {
					socket.leave(this.buildVendorRoom(vendorId));
					this.userConnectionManager.removeUserFromVendorRoom(userId, vendorId);
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

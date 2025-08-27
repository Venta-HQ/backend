import { Socket } from 'socket.io';
import { UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import type { LocationUpdate } from '@venta/domains/location-services/contracts/types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { WsErrorInterceptor } from '@venta/nest/interceptors';
import { BaseWebSocketGateway, Logger } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { UserConnectionManagerService } from './user.manager';

@WebSocketGateway({
	namespace: 'user',
	cors: {
		origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
	},
})
@UseInterceptors(WsErrorInterceptor)
export class UserLocationGateway extends BaseWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	protected readonly connectionManager = this.userConnectionManager;

	constructor(
		private readonly userConnectionManager: UserConnectionManagerService,
		protected readonly logger: Logger,
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

			// Get all vendor rooms this user is in
			const vendorRooms = await this.userConnectionManager.getUserVendorRooms(userId);

			// Join all vendor rooms
			vendorRooms.forEach((vendorId) => {
				client.join(vendorId);
			});

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
				client.leave(vendorId);
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
	@Throttle({ default: { ttl: 60_000, limit: 2 } })
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
			const locationUpdate: LocationUpdate = UserLocationUpdateACL.toDomain(data, userId);

			// Adjust to current gRPC API; if nearby search isn't exposed yet, keep current rooms unchanged
			const nearbyVendors: Array<{ entityId: string }> = [];

			// Join rooms for nearby vendors
			nearbyVendors.forEach((vendor) => {
				socket.join(vendor.entityId);
				this.userConnectionManager.addUserToVendorRoom(userId, vendor.entityId);
			});

			// Get current vendor rooms
			const currentRooms = await this.userConnectionManager.getUserVendorRooms(userId);

			// Leave rooms for vendors that are no longer nearby
			currentRooms.forEach((vendorId) => {
				if (!nearbyVendors.some((vendor) => vendor.entityId === vendorId)) {
					socket.leave(vendorId);
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

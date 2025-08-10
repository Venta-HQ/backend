import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { LocationUpdateACL, RealtimeMessageACL } from '@venta/domains/location-services/contracts';
import type {
	GeospatialQuery,
	LocationUpdate,
	RealtimeMessage,
} from '@venta/domains/location-services/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AuthenticatedSocket, WsAuthGuard, WsRateLimitGuard } from '@venta/nest/guards';
import { UserConnectionManagerService } from '../user-connection-manager.service';

@WebSocketGateway({
	namespace: 'user',
	cors: {
		origin: '*',
	},
})
@UseGuards(WsAuthGuard, WsRateLimitGuard)
export class UserLocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(UserLocationGateway.name);

	constructor(
		private readonly userConnectionManager: UserConnectionManagerService,
		private readonly geolocationService: any, // TODO: Import proper geolocation service type
	) {}

	/**
	 * Handle new WebSocket connections
	 */
	async handleConnection(client: AuthenticatedSocket) {
		try {
			const userId = client.handshake.query.userId?.toString();

			if (!userId) {
				this.logger.warn('User connection attempt without userId', {
					socketId: client.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
			}

			// Register the user connection
			await this.userConnectionManager.registerUser(client.id, userId);

			// Get all vendor rooms this user is in
			const vendorRooms = await this.userConnectionManager.getUserVendorRooms(userId);

			// Join all vendor rooms
			vendorRooms.forEach((vendorId) => {
				client.join(vendorId);
			});

			this.logger.log('User connected', {
				socketId: client.id,
				userId,
			});
		} catch (error) {
			this.logger.error('Failed to handle user connection', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: client.id,
			});

			throw AppError.internal(ErrorCodes.ERR_WEBSOCKET_ERROR, {
				operation: 'handle_user_connection',
				socketId: client.id,
			});
		}
	}

	/**
	 * Handle WebSocket disconnections
	 */
	async handleDisconnect(client: Socket) {
		try {
			const connectionInfo = await this.userConnectionManager.getConnectionInfo(client.id);

			if (!connectionInfo) {
				throw AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
					resourceType: 'user_connection',
					resourceId: client.id,
					operation: 'handle_user_disconnection',
					socketId: client.id,
					type: 'user',
				});
			}

			// Get all vendor rooms this user is in before disconnecting
			const vendorRooms = await this.userConnectionManager.getUserVendorRooms(connectionInfo.userId);

			// Handle user disconnection
			await this.userConnectionManager.handleUserDisconnect(client.id, connectionInfo.userId);

			// Leave all vendor rooms
			vendorRooms.forEach((vendorId) => {
				client.leave(vendorId);
			});

			this.logger.log('User disconnected', {
				socketId: client.id,
				userId: connectionInfo.userId,
			});
		} catch (error) {
			this.logger.error('Failed to handle user disconnection', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: client.id,
			});

			throw AppError.internal(ErrorCodes.ERR_WEBSOCKET_ERROR, {
				operation: 'handle_user_disconnection',
				socketId: client.id,
			});
		}
	}

	/**
	 * Handle user location updates
	 */
	@SubscribeMessage('update_location')
	async handleLocationUpdate(
		socket: Socket,
		data: any, // Raw WebSocket data
	) {
		try {
			const userId = await this.userConnectionManager.getSocketUserId(socket.id);

			if (!userId) {
				this.logger.warn('Location update from unregistered user', {
					socketId: socket.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
			}

			// Transform WebSocket data to LocationUpdate domain object
			const locationUpdate: LocationUpdate = {
				entityId: userId,
				entityType: 'user',
				coordinates: {
					lat: data.lat || data.latitude,
					lng: data.lng || data.longitude,
				},
				timestamp: new Date().toISOString(),
			};

			// Validate the location update using ACL
			LocationUpdateACL.validate(locationUpdate);

			// Create geospatial query for nearby vendors using current location
			const nearbyQuery: GeospatialQuery = {
				entityType: 'vendor',
				center: locationUpdate.coordinates,
				radius: data.radius || 5000, // Default 5km radius
			};

			const nearbyVendors = await this.geolocationService.getNearbyVendors(nearbyQuery);

			// Join rooms for nearby vendors
			nearbyVendors.forEach((vendor) => {
				socket.join(vendor.entityId);
				this.userConnectionManager.addUserToVendorRoom(userId, vendor.entityId);
			});

			// Get current vendor rooms
			const currentRooms = await this.userConnectionManager.getUserVendorRooms(userId);

			// Leave rooms for vendors that are no longer nearby
			currentRooms.forEach((vendorId) => {
				if (!nearbyVendors.some((vendor) => vendor.vendorId === vendorId)) {
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

			this.logger.log('User location updated', {
				socketId: socket.id,
				userId,
				location: data,
			});
		} catch (error) {
			this.logger.error('Failed to update user location', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
			});

			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_user_location',
				socketId: socket.id,
			});
		}
	}
}

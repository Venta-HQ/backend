import { Server, Socket } from 'socket.io';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { AuthenticatedSocket } from '@app/nest/guards/types';
import { WsAuthGuard } from '@app/nest/guards/ws-auth';
import { WsRateLimitGuard } from '@app/nest/guards/ws-rate-limit';
import { GeolocationService } from '@domains/location-services/apps/geolocation/src/core/geolocation.service';
import { Logger, UseGuards } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
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
		private readonly geolocationService: GeolocationService,
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
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
					operation: 'handle_user_connection',
					socketId: client.id,
				});
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

			throw AppError.internal(ErrorCodes.ERR_WS_CONNECTION_FAILED, {
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

			throw AppError.internal(ErrorCodes.ERR_WS_CONNECTION_FAILED, {
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
		data: { neLocation: { lat: number; long: number }; swLocation: { lat: number; long: number } },
	) {
		try {
			const userId = await this.userConnectionManager.getSocketUserId(socket.id);

			if (!userId) {
				this.logger.warn('Location update from unregistered user', {
					socketId: socket.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
					operation: 'update_user_location',
					socketId: socket.id,
				});
			}

			// Calculate center point for user location
			const centerLat = (data.neLocation.lat + data.swLocation.lat) / 2;
			const centerLong = (data.neLocation.long + data.swLocation.long) / 2;

			// Get nearby vendors based on user's location bounds
			const nearbyVendors = await this.geolocationService.getNearbyVendors({
				bounds: {
					ne: {
						lat: data.neLocation.lat,
						long: data.neLocation.long,
					},
					sw: {
						lat: data.swLocation.lat,
						long: data.swLocation.long,
					},
				},
			});

			// Join rooms for nearby vendors
			nearbyVendors.forEach((vendor) => {
				socket.join(vendor.vendorId);
				this.userConnectionManager.addUserToVendorRoom(userId, vendor.vendorId);
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
					lat: centerLat,
					long: centerLong,
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

			throw AppError.internal(ErrorCodes.ERR_LOC_UPDATE_FAILED, {
				operation: 'update_user_location',
				socketId: socket.id,
			});
		}
	}
}

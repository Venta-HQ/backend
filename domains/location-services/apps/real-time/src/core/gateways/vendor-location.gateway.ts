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
import { VendorConnectionManagerService } from '../vendor-connection-manager.service';

@WebSocketGateway({
	namespace: 'vendor',
	cors: {
		origin: '*',
	},
})
@UseGuards(WsAuthGuard, WsRateLimitGuard)
export class VendorLocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(VendorLocationGateway.name);

	constructor(
		private readonly vendorConnectionManager: VendorConnectionManagerService,
		private readonly geolocationService: GeolocationService,
	) {}

	/**
	 * Handle new WebSocket connections
	 */
	async handleConnection(client: AuthenticatedSocket) {
		try {
			const vendorId = client.handshake.query.vendorId?.toString();

			if (!vendorId) {
				this.logger.warn('Vendor connection attempt without vendorId', {
					socketId: client.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
					operation: 'handle_vendor_connection',
					socketId: client.id,
				});
			}

			// Register the vendor connection
			await this.vendorConnectionManager.registerVendor(client.id, vendorId);

			// Get all users in this vendor's room
			const roomUsers = await this.vendorConnectionManager.getVendorRoomUsers(vendorId);

			// Notify users that vendor is online
			roomUsers.forEach((userId) => {
				this.server.to(userId).emit('vendor_status_changed', {
					vendorId,
					isOnline: true,
				});
			});

			this.logger.log('Vendor connected', {
				socketId: client.id,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to handle vendor connection', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: client.id,
			});

			throw AppError.internal(ErrorCodes.ERR_WS_CONNECTION_FAILED, {
				operation: 'handle_vendor_connection',
				socketId: client.id,
			});
		}
	}

	/**
	 * Handle WebSocket disconnections
	 */
	async handleDisconnect(client: Socket) {
		try {
			const connectionInfo = await this.vendorConnectionManager.getConnectionInfo(client.id);

			if (!connectionInfo) {
				this.logger.warn('Vendor disconnection without connection info', {
					socketId: client.id,
				});
				return;
			}

			// Get all users in this vendor's room before disconnecting
			const roomUsers = await this.vendorConnectionManager.getVendorRoomUsers(connectionInfo.vendorId);

			// Handle vendor disconnection
			await this.vendorConnectionManager.handleVendorDisconnect(client.id, connectionInfo.vendorId);

			// Notify users that vendor is offline
			roomUsers.forEach((userId) => {
				this.server.to(userId).emit('vendor_status_changed', {
					vendorId: connectionInfo.vendorId,
					isOnline: false,
				});
			});

			this.logger.log('Vendor disconnected', {
				socketId: client.id,
				vendorId: connectionInfo.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnection', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: client.id,
			});

			throw AppError.internal(ErrorCodes.ERR_WS_CONNECTION_FAILED, {
				operation: 'handle_vendor_disconnection',
				socketId: client.id,
			});
		}
	}

	/**
	 * Handle vendor location updates
	 */
	@SubscribeMessage('update_location')
	async handleLocationUpdate(socket: Socket, data: { lat: number; long: number }) {
		try {
			const vendorId = await this.vendorConnectionManager.getSocketVendorId(socket.id);

			if (!vendorId) {
				this.logger.warn('Location update from unregistered vendor', {
					socketId: socket.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
					operation: 'update_vendor_location',
					socketId: socket.id,
				});
			}

			// Update vendor location in geolocation service
			await this.geolocationService.updateVendorLocation({
				entityId: vendorId,
				coordinates: {
					lat: data.lat,
					long: data.long,
				},
			});

			// Get all users in this vendor's room
			const roomUsers = await this.vendorConnectionManager.getVendorRoomUsers(vendorId);

			// Notify users about location update
			roomUsers.forEach((userId) => {
				this.server.to(userId).emit('vendor_location_changed', {
					vendorId,
					location: {
						lat: data.lat,
						long: data.long,
					},
				});
			});

			// Notify vendor about successful update
			socket.emit('location_updated', {
				vendorId,
				coordinates: {
					lat: data.lat,
					long: data.long,
				},
			});

			this.logger.log('Vendor location updated', {
				socketId: socket.id,
				vendorId,
				location: data,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: socket.id,
			});

			throw AppError.internal(ErrorCodes.ERR_LOC_UPDATE_FAILED, {
				operation: 'update_vendor_location',
				socketId: socket.id,
			});
		}
	}
}

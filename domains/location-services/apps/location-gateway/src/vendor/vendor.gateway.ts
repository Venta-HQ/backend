import { Socket } from 'socket.io';
import { Inject, UseGuards } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { AuthenticatedSocket } from '@venta/apitypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { WsAuthGuard } from '@venta/nest/guards';
import { BaseWebSocketGateway, GrpcInstance, Logger } from '@venta/nest/modules';
import { GEOLOCATION_SERVICE_NAME, GeolocationServiceClient } from '@venta/proto/location-services/geolocation';
import { VendorConnectionManagerService } from '../vendor/vendor.manager';

@WebSocketGateway({
	namespace: 'vendor',
	cors: {
		origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
	},
})
@UseGuards(WsAuthGuard)
export class VendorLocationGateway extends BaseWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	protected readonly connectionManager = this.vendorConnectionManager;

	constructor(
		private readonly vendorConnectionManager: VendorConnectionManagerService,
		@Inject(GEOLOCATION_SERVICE_NAME)
		private readonly geolocationService: GrpcInstance<GeolocationServiceClient>,
		protected readonly logger: Logger,
	) {
		super();
		this.logger.setContext(VendorLocationGateway.name);
	}

	/**
	 * Handle new WebSocket connections
	 */
	async handleConnection(client: AuthenticatedSocket) {
		try {
			// Validate connection using base class method
			const vendorId = this.validateConnection(client, 'Vendor');
			if (!vendorId) return;

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

			// Log success using base class method
			this.logConnectionSuccess(client, vendorId, 'Vendor');
		} catch (error) {
			// Handle error using base class method
			this.handleConnectionError(error, client, 'handle vendor connection');
		}
	}

	/**
	 * Handle WebSocket disconnections
	 */
	async handleDisconnect(client: Socket) {
		try {
			const connectionInfo = await this.vendorConnectionManager.getConnectionInfo(client.id);

			if (!connectionInfo) {
				this.logger.warn('Vendor disconnection attempt without connection info', {
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

			// Log success using base class method
			this.logDisconnectionSuccess(client, 'Vendor');
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnection', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId: client.id,
			});
			// For disconnections, we don't throw - just log the error
		}
	}

	/**
	 * Handle vendor location updates
	 */
	@SubscribeMessage('update_location')
	async handleLocationUpdate(socket: Socket, data: { lat: number; lng: number }) {
		try {
			const vendorId = await this.vendorConnectionManager.getSocketVendorId(socket.id);

			if (!vendorId) {
				this.logger.warn('Location update from unregistered vendor', {
					socketId: socket.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
			}

			// Update vendor location in geolocation service
			await this.geolocationService.invoke('updateVendorLocation', {
				entityId: vendorId,
				coordinates: {
					lat: data.lat,
					lng: data.lng,
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
						lng: data.lng,
					},
				});
			});

			// Notify vendor about successful update
			socket.emit('location_updated', {
				vendorId,
				coordinates: {
					lat: data.lat,
					lng: data.lng,
				},
			});

			this.logger.debug('Vendor location updated', {
				socketId: socket.id,
				vendorId,
				location: data,
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

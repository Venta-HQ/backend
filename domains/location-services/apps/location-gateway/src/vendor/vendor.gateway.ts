import { Socket } from 'socket.io';
import { UseInterceptors, UsePipes } from '@nestjs/common';
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
	VendorLocationUpdateACL,
	vendorLocationUpdateSchema,
	type VendorLocationUpdateRequest,
} from '@venta/domains/location-services/contracts';
import type { LocationUpdate } from '@venta/domains/location-services/contracts/types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { WsErrorInterceptor } from '@venta/nest/interceptors';
import { BaseWebSocketGateway, Logger } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { VendorConnectionManagerService } from '../vendor/vendor.manager';

@WebSocketGateway({
	namespace: 'vendor',
	cors: {
		origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
	},
})
@UseInterceptors(WsErrorInterceptor)
export class VendorLocationGateway extends BaseWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	protected readonly connectionManager = this.vendorConnectionManager;

	constructor(
		private readonly vendorConnectionManager: VendorConnectionManagerService,
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
	 * Handle vendor location updates - now with clean decorator-based validation!
	 */
	@SubscribeMessage('update_location')
	@Throttle({ default: { ttl: 60_000, limit: 15 } })
	@UsePipes(new SchemaValidatorPipe(vendorLocationUpdateSchema))
	async handleLocationUpdate(
		@ConnectedSocket() socket: AuthenticatedSocket,
		@MessageBody() data: VendorLocationUpdateRequest, // Automatically validated by pipe!
	) {
		try {
			const vendorId = await this.vendorConnectionManager.getSocketVendorId(socket.id);

			if (!vendorId) {
				this.logger.warn('Location update from unregistered vendor', {
					socketId: socket.id,
				});
				throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
			}

			// Transform validated data to domain object using ACL
			const locationUpdate: LocationUpdate = VendorLocationUpdateACL.toDomain(data, vendorId);

			// Update vendor location in geolocation service
			// await this.geolocationService.invoke('updateVendorLocation', {
			// 	entityId: vendorId,
			// 	coordinates: {
			// 		lat: locationUpdate.coordinates.lat,
			// 		lng: locationUpdate.coordinates.lng,
			// 	},
			// });

			// Get all users in this vendor's room
			const roomUsers = await this.vendorConnectionManager.getVendorRoomUsers(vendorId);

			// Notify users about location update
			roomUsers.forEach((userId) => {
				this.server.to(userId).emit('vendor_location_changed', {
					vendorId,
					location: {
						lat: locationUpdate.coordinates.lat,
						lng: locationUpdate.coordinates.lng,
					},
				});
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

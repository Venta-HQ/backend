import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { WsAuthGuard, WsRateLimitGuards } from '@app/nest/guards';
import { EventService, GrpcInstance } from '@app/nest/modules';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { GEOLOCATION_SERVICE_NAME, GeolocationServiceClient } from '@app/proto/location-services/geolocation';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Inject, Injectable, Logger, UseGuards } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { WebSocketACL } from '../anti-corruption-layers/websocket-acl';
import { RealtimeToMarketplaceContextMapper } from '../context-mappers/realtime-to-marketplace-context-mapper';
import { WEBSOCKET_METRICS, WebSocketGatewayMetrics } from '../metrics.provider';
import { VendorConnectionManagerService } from '../services/vendor-connection-manager.service';
import { RealTime } from '../types/context-mapping.types';

// Extend Socket interface to include vendor properties
interface AuthenticatedVendorSocket extends Socket {
	clerkId?: string;
	vendorId?: string;
}

@Injectable()
@WebSocketGateway({ namespace: '/vendor' })
@UseGuards(WsAuthGuard) // Require authentication for all vendor connections
export class VendorLocationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(VendorLocationGateway.name);

	constructor(
		@Inject(GEOLOCATION_SERVICE_NAME) private readonly locationService: GrpcInstance<GeolocationServiceClient>,
		@InjectRedis() private readonly redis: Redis,
		private readonly connectionManager: VendorConnectionManagerService,
		private readonly eventService: EventService,
		@Inject(WEBSOCKET_METRICS) private readonly metrics: WebSocketGatewayMetrics,
		private readonly websocketACL: WebSocketACL,
		private readonly contextMapper: RealtimeToMarketplaceContextMapper,
	) {}

	afterInit() {
		// Gateway initialization complete
		// Note: GrpcInstance is automatically initialized and ready to use
		// No manual service initialization needed like with ClientGrpc pattern
	}

	@WebSocketServer() server!: Server;

	async handleConnection(client: AuthenticatedVendorSocket) {
		this.logger.debug('Vendor client connected', { clientId: client.id });

		try {
			if (!client.vendorId) {
				throw AppError.unauthorized('VENDOR_NOT_FOUND', ErrorCodes.VENDOR_NOT_FOUND, {
					operation: 'handle_vendor_connection',
					socketId: client.id,
				});
			}

			// Create domain connection
			const connection = this.websocketACL.toDomainConnection(client.id, client.vendorId, {
				type: 'vendor',
				clerkId: client.clerkId,
			});

			// Record connection metrics
			this.metrics.vendor_websocket_connections_total.inc({ status: 'connected', type: 'vendor' });
			this.metrics.vendor_websocket_connections_active.inc({ type: 'vendor' });

			// Emit vendor connected event
			await this.eventService.emit('location.vendor.connected', {
				vendorId: client.vendorId,
				socketId: client.id,
				timestamp: new Date().toISOString(),
				metadata: {
					clerkId: client.clerkId,
				},
			});

			this.logger.debug('Vendor client registered', {
				clientId: client.id,
				vendorId: client.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to handle vendor connection', {
				error: error instanceof Error ? error.message : 'Unknown error',
				clientId: client.id,
			});

			if (error instanceof AppError) {
				// Record error metrics
				this.metrics.vendor_websocket_errors_total.inc({ type: 'connection' });
				throw error;
			}

			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'handle_vendor_connection',
				socketId: client.id,
			});
		} finally {
			if (!client.connected) {
				client.disconnect();
			}
		}
	}

	async handleDisconnect(client: AuthenticatedVendorSocket) {
		this.logger.debug('Vendor client disconnected', { clientId: client.id });

		try {
			// Record disconnection metrics
			this.metrics.vendor_websocket_disconnections_total.inc({ reason: 'disconnect', type: 'vendor' });
			this.metrics.vendor_websocket_connections_active.dec({ type: 'vendor' });

			// Clean up connection
			await this.connectionManager.handleDisconnect(client.id);

			// Emit vendor disconnected event
			await this.eventService.emit('location.vendor.disconnected', {
				vendorId: client.vendorId,
				socketId: client.id,
				timestamp: new Date().toISOString(),
				reason: 'client_disconnect',
			});
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnection', {
				error: error instanceof Error ? error.message : 'Unknown error',
				clientId: client.id,
			});

			if (error instanceof AppError) {
				// Record error metrics
				this.metrics.vendor_websocket_errors_total.inc({ type: 'disconnection' });
				throw error;
			}

			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'handle_vendor_disconnection',
				socketId: client.id,
			});
		}
	}

	@SubscribeMessage('updateVendorLocation')
	@UseGuards(WsRateLimitGuards.lenient) // 30 location updates per minute for vendors
	async updateVendorLocation(
		@MessageBody(new SchemaValidatorPipe(RealTime.Validation.LocationUpdateSchema))
		data: { lat: number; lng: number },
		@ConnectedSocket() socket: AuthenticatedVendorSocket,
	) {
		const vendorId = socket.vendorId;
		if (!vendorId) {
			throw AppError.unauthorized('VENDOR_NOT_FOUND', ErrorCodes.VENDOR_NOT_FOUND, {
				operation: 'update_vendor_location',
				socketId: socket.id,
			});
		}

		this.logger.debug('Processing vendor location update', {
			vendorId,
			coordinates: { lat: data.lat, lng: data.lng },
		});

		try {
			// Record location update metrics
			this.metrics.location_updates_total.inc({ status: 'success', type: 'vendor' });

			// Update location via gRPC service
			await this.locationService.invoke('updateVendorLocation', {
				entityId: vendorId,
				location: {
					lat: data.lat,
					long: data.lng,
				},
			});

			// Notify subscribers
			socket.to(vendorId).emit('vendor_sync', {
				id: vendorId,
				location: { lat: data.lat, lng: data.lng },
				timestamp: new Date().toISOString(),
			});

			// Emit vendor location updated event
			await this.eventService.emit('location.vendor.location_updated', {
				vendorId,
				location: {
					lat: data.lat,
					lng: data.lng,
				},
				timestamp: new Date().toISOString(),
			});

			this.logger.debug('Vendor location updated successfully', {
				vendorId,
				coordinates: { lat: data.lat, lng: data.lng },
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId,
			});

			// Record error metrics
			this.metrics.vendor_websocket_errors_total.inc({ type: 'location_update' });

			if (error instanceof AppError) throw error;
			throw AppError.internal('LOCATION_UPDATE_FAILED', ErrorCodes.LOCATION_UPDATE_FAILED, {
				operation: 'update_vendor_location',
				vendorId,
				coordinates: { lat: data.lat, lng: data.lng },
			});
		}
	}
}

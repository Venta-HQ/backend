import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { VendorLocationUpdateData, VendorLocationUpdateDataSchema } from '@app/apitypes';
import { WsAuthGuard, WsRateLimitGuards } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { GEOLOCATION_SERVICE_NAME, GeolocationServiceClient } from '@app/proto/location-services/geolocation';
import { retryOperation } from '@app/utils';
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
import { WEBSOCKET_METRICS, WebSocketGatewayMetrics } from '../metrics.provider';
import { VendorConnectionManagerService } from '../services/vendor-connection-manager.service';

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
		@Inject(WEBSOCKET_METRICS) private readonly metrics: WebSocketGatewayMetrics,
	) {}

	afterInit() {
		// Gateway initialization complete
		// Note: GrpcInstance is automatically initialized and ready to use
		// No manual service initialization needed like with ClientGrpc pattern
	}

	@WebSocketServer() server!: Server;

	async handleConnection(client: AuthenticatedVendorSocket) {
		this.logger.log(`Vendor client connected: ${client.id}`);

		// Record connection metrics
		this.metrics.vendor_websocket_connections_total.inc({ status: 'connected', type: 'vendor' });
		this.metrics.vendor_websocket_connections_active.inc({ type: 'vendor' });

		// Handle vendor registration (now redundant since auth guard handles it)
		client.on('register-vendor', async (data) => {
			if (data.vendorId) {
				await this.connectionManager.registerVendor(data.vendorId, client.id);
				this.logger.log(`Vendor ${data.vendorId} registered with socket ${client.id}`);
			}
		});
	}

	async handleDisconnect(client: AuthenticatedVendorSocket) {
		this.logger.log(`Vendor client disconnected: ${client.id}`);

		// Record disconnection metrics
		this.metrics.vendor_websocket_disconnections_total.inc({ reason: 'disconnect', type: 'vendor' });
		this.metrics.vendor_websocket_connections_active.dec({ type: 'vendor' });
		await this.connectionManager.handleDisconnect(client.id);
	}

	@SubscribeMessage('updateVendorLocation')
	@UseGuards(WsRateLimitGuards.lenient) // 30 location updates per minute for vendors
	async updateVendorLocation(
		@MessageBody(new SchemaValidatorPipe(VendorLocationUpdateDataSchema)) data: VendorLocationUpdateData,
		@ConnectedSocket() socket: AuthenticatedVendorSocket,
	) {
		// Vendor ID is guaranteed to be available from WsAuthGuard
		const vendorId = socket.vendorId;
		if (!vendorId) {
			this.logger.error('No vendor ID found for authenticated socket');
			socket.emit('error', {
				code: 'UNAUTHORIZED',
				message: 'Vendor not authenticated',
			});
			return;
		}

		// Record location update metrics
		this.metrics.location_updates_total.inc({ status: 'success', type: 'vendor' });

		try {
			// Store vendor location in database via gRPC service
			await this.locationService
				.invoke('updateVendorLocation', {
					entityId: vendorId,
					location: {
						lat: data.lat,
						long: data.long,
					},
				})
				.toPromise();

			// Store vendor location in Redis for geospatial queries
			await retryOperation(
				async () => {
					await this.redis.zadd('vendor_locations', data.lat, vendorId);
				},
				'Update vendor location in Redis',
				{ logger: this.logger },
			);

			// Notify all users tracking this vendor about the location update
			socket.to(vendorId).emit('vendor_sync', {
				id: vendorId,
				location: {
					lat: data.lat,
					long: data.long,
				},
			});

			this.logger.debug(`Vendor ${vendorId} location updated: lat=${data.lat}, long=${data.long}`);
		} catch (error) {
			this.logger.error(`Failed to update vendor location for ${vendorId}:`, error);
			socket.emit('error', { message: 'Failed to update location' });
		}
	}
}

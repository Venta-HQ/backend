import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { VendorLocationUpdateData, VendorLocationUpdateDataSchema } from '@app/apitypes';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
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
import { VendorConnectionManagerService } from '../services/vendor-connection-manager.service';

@Injectable()
@WebSocketGateway({ namespace: '/vendor' })
export class VendorLocationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(VendorLocationGateway.name);
	private locationService!: LocationServiceClient;

	constructor(
		@Inject(LOCATION_SERVICE_NAME) private readonly grpcClient: ClientGrpc,
		@InjectRedis() private readonly redis: Redis,
		private readonly connectionManager: VendorConnectionManagerService,
	) {}

	afterInit() {
		this.locationService = this.grpcClient.getService<LocationServiceClient>(LOCATION_SERVICE_NAME);
	}

	@WebSocketServer() server!: Server;

	async handleConnection(client: Socket) {
		this.logger.log(`Vendor client connected: ${client.id}`);

		// Handle vendor registration
		client.on('register-vendor', async (data) => {
			if (data.vendorId) {
				await this.connectionManager.registerVendor(data.vendorId, client.id);
				this.logger.log(`Vendor ${data.vendorId} registered with socket ${client.id}`);
			}
		});
	}

	async handleDisconnect(client: Socket) {
		this.logger.log(`Vendor client disconnected: ${client.id}`);
		await this.connectionManager.handleDisconnect(client.id);
	}

	@SubscribeMessage('updateVendorLocation')
	async updateVendorLocation(
		@MessageBody(new SchemaValidatorPipe(VendorLocationUpdateDataSchema)) data: VendorLocationUpdateData,
		@ConnectedSocket() socket: Socket,
	) {
		const vendorId = await this.connectionManager.getSocketVendorId(socket.id);
		if (!vendorId) {
			this.logger.error('No vendor ID found for socket');
			return;
		}

		try {
			// Store vendor location in database via gRPC service
			this.locationService
				.updateVendorLocation({
					entityId: vendorId,
					location: {
						lat: data.lat,
						long: data.long,
					},
				})
				.subscribe({
					error: (error) => {
						this.logger.error(`Failed to update vendor ${vendorId} location in database:`, error);
					},
					next: () => {
						this.logger.debug(`Vendor ${vendorId} location updated in database`);
					},
				});

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

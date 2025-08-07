import { Server, Socket } from 'socket.io';
import { UpdateUserLocationData, UpdateUserLocationDataSchema } from '@app/apitypes';
import { WsAuthGuard, WsRateLimitGuards } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { GEOLOCATION_SERVICE_NAME, GeolocationServiceClient } from '@app/proto/location-services/geolocation';
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
import { UserConnectionManagerService } from '../services/user-connection-manager.service';

// Extend Socket interface to include user properties
interface AuthenticatedSocket extends Socket {
	clerkId?: string;
	userId?: string;
}

@Injectable()
@WebSocketGateway({ namespace: '/user' })
@UseGuards(WsAuthGuard) // Require authentication for all user connections
export class UserLocationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(UserLocationGateway.name);

	constructor(
		@Inject(GEOLOCATION_SERVICE_NAME) private readonly locationService: GrpcInstance<GeolocationServiceClient>,
		private readonly connectionManager: UserConnectionManagerService,
		@Inject(WEBSOCKET_METRICS) private readonly metrics: WebSocketGatewayMetrics,
	) {}

	afterInit() {
		// Gateway initialization complete
		// Note: GrpcInstance is automatically initialized and ready to use
		// No manual service initialization needed like with ClientGrpc pattern
	}

	@WebSocketServer() server!: Server;

	async handleConnection(client: AuthenticatedSocket) {
		this.logger.log(`User client connected: ${client.id}`);

		// Record connection metrics
		this.metrics.user_websocket_connections_total.inc({ status: 'connected', type: 'user' });
		this.metrics.user_websocket_connections_active.inc({ type: 'user' });

		// Handle user registration (now redundant since auth guard handles it)
		client.on('register-user', async (data) => {
			if (data.userId) {
				await this.connectionManager.registerUser(data.userId, client.id);
				this.logger.log(`User ${data.userId} registered with socket ${client.id}`);
			}
		});
	}

	async handleDisconnect(client: AuthenticatedSocket) {
		this.logger.log(`User client disconnected: ${client.id}`);

		// Record disconnection metrics
		this.metrics.user_websocket_disconnections_total.inc({ reason: 'disconnect', type: 'user' });
		this.metrics.user_websocket_connections_active.dec({ type: 'user' });
		await this.connectionManager.handleDisconnect(client.id);
	}

	@SubscribeMessage('updateUserLocation')
	@UseGuards(WsRateLimitGuards.standard) // 15 location updates per minute
	async updateUserLocation(
		@MessageBody(new SchemaValidatorPipe(UpdateUserLocationDataSchema)) data: UpdateUserLocationData,
		@ConnectedSocket() socket: AuthenticatedSocket,
	) {
		// User ID is guaranteed to be available from WsAuthGuard
		const userId = socket.userId;
		if (!userId) {
			this.logger.error('No user ID found for authenticated socket');
			socket.emit('error', {
				code: 'UNAUTHORIZED',
				message: 'User not authenticated',
			});
			return;
		}

		// Record location update metrics
		this.metrics.location_updates_total.inc({ status: 'success', type: 'user' });

		const { neLocation, swLocation } = data;

		try {
			// Get vendors in the user's current location
			const { vendors } = await this.locationService
				.invoke('vendorLocations', {
					neLocation: {
						lat: neLocation.lat,
						long: neLocation.long,
					},
					swLocation: {
						lat: swLocation.lat,
						long: swLocation.long,
					},
				})
				.toPromise();

			const currentRooms = await this.connectionManager.getUserVendorRooms(userId);
			const vendorIds = (vendors ?? []).map((vendor) => vendor.id);

			// Find rooms to leave (vendors no longer in range)
			const roomsToLeave = currentRooms.filter((room) => !vendorIds.includes(room));

			// Find rooms to join (new vendors in range)
			const roomsToJoin = vendorIds.filter((room) => !currentRooms.includes(room));

			// Leave rooms for vendors no longer in range
			if (roomsToLeave.length) {
				for (const room of roomsToLeave) {
					await this.connectionManager.removeUserFromVendorRoom(userId, room);
					socket.leave(room);
				}
				this.logger.debug(`User ${userId} left ${roomsToLeave.length} vendor rooms`);
			}

			// Join rooms for new vendors in range
			if (roomsToJoin.length) {
				for (const room of roomsToJoin) {
					await this.connectionManager.addUserToVendorRoom(userId, room);
					socket.join(room);
				}
				this.logger.debug(`User ${userId} joined ${roomsToJoin.length} vendor rooms`);
			}

			// Emit updated vendor list to user
			socket.emit('vendor_channels', vendors ?? []);

			this.logger.debug(`User ${userId} location updated, now tracking ${vendorIds.length} vendors`);
		} catch (error) {
			this.logger.error(`Failed to update user location for ${userId}:`, error.stack, { error, userId });
			socket.emit('error', { message: 'Failed to update location' });
		}
	}
}

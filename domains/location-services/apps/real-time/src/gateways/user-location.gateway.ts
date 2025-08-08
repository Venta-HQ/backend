import { Server, Socket } from 'socket.io';
import { WsAuthGuard, WsRateLimitGuards } from '@app/nest/guards';
import { EventService, GrpcInstance } from '@app/nest/modules';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { GEOLOCATION_SERVICE_NAME, GeolocationServiceClient } from '@app/proto/location-services/geolocation';
import { UpdateUserLocationData, UpdateUserLocationDataSchema } from '@domains/location-services/contracts/types';
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
		private readonly eventService: EventService,
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

				// Emit user connected event
				await this.eventService.emit('location.user.connected', {
					userId: data.userId,
					socketId: client.id,
					timestamp: new Date().toISOString(),
				});
			}
		});
	}

	async handleDisconnect(client: AuthenticatedSocket) {
		this.logger.log(`User client disconnected: ${client.id}`);

		// Record disconnection metrics
		this.metrics.user_websocket_disconnections_total.inc({ reason: 'disconnect', type: 'user' });
		this.metrics.user_websocket_connections_active.dec({ type: 'user' });

		// Get user ID before removing connection
		const userId = await this.connectionManager.getSocketUserId(client.id);

		await this.connectionManager.handleDisconnect(client.id);

		if (userId) {
			// Emit user disconnected event
			await this.eventService.emit('location.user.disconnected', {
				userId,
				socketId: client.id,
				timestamp: new Date().toISOString(),
			});
		}
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
					await this.connectionManager.removeUserFromVendorRoom({ userId, vendorId: room });
					socket.leave(room);

					// Emit user left vendor area event
					await this.eventService.emit('location.user.left_vendor_area', {
						userId,
						vendorId: room,
						timestamp: new Date().toISOString(),
					});
				}
				this.logger.debug(`User ${userId} left ${roomsToLeave.length} vendor rooms`);
			}

			// Join rooms for new vendors in range
			if (roomsToJoin.length) {
				for (const room of roomsToJoin) {
					await this.connectionManager.addUserToVendorRoom({ userId, vendorId: room });
					socket.join(room);

					// Emit user entered vendor area event
					await this.eventService.emit('location.user.entered_vendor_area', {
						userId,
						vendorId: room,
						timestamp: new Date().toISOString(),
					});
				}
				this.logger.debug(`User ${userId} joined ${roomsToJoin.length} vendor rooms`);
			}

			// Emit updated vendor list to user
			socket.emit('vendor_channels', vendors ?? []);

			// Emit user location updated event
			await this.eventService.emit('location.user.location_updated', {
				userId,
				location: {
					lat: (neLocation.lat + swLocation.lat) / 2, // Use center point
					lng: (neLocation.long + swLocation.long) / 2,
				},
				timestamp: new Date().toISOString(),
			});

			this.logger.debug(`User ${userId} location updated, now tracking ${vendorIds.length} vendors`);
		} catch (error) {
			this.logger.error(`Failed to update user location for ${userId}:`, error.stack, { error, userId });
			socket.emit('error', { message: 'Failed to update location' });
		}
	}
}

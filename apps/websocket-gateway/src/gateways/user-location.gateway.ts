import Redis from 'ioredis';
import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { UpdateUserLocationData, UpdateUserLocationDataSchema } from '@app/apitypes';
import { WsAuthGuard, WsRateLimitGuards } from '@app/nest/guards';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Inject, Injectable, Logger, UseGuards } from '@nestjs/common';
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
import { ConnectionHealthService } from '../services/connection-health.service';
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
	private locationService!: LocationServiceClient;

	constructor(
		@Inject(LOCATION_SERVICE_NAME) private readonly grpcClient: ClientGrpc,
		@InjectRedis() private readonly redis: Redis,
		private readonly connectionManager: UserConnectionManagerService,
		private readonly connectionHealth: ConnectionHealthService,
	) {}

	afterInit() {
		this.locationService = this.grpcClient.getService<LocationServiceClient>(LOCATION_SERVICE_NAME);
	}

	@WebSocketServer() server!: Server;

	async handleConnection(client: AuthenticatedSocket) {
		this.logger.log(`User client connected: ${client.id}`);

		// Record connection health metrics
		await this.connectionHealth.recordConnection(client.id, client.userId);

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

		// Record disconnection health metrics
		await this.connectionHealth.recordDisconnection(client.id);
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

		// Update connection activity
		await this.connectionHealth.updateActivity(socket.id);

		const { neLocation, swLocation } = data;

		try {
			// Get vendors in the user's current location
			const { vendors } = await firstValueFrom(
				this.locationService.vendorLocations({
					neLocation: {
						lat: neLocation.lat,
						long: neLocation.long,
					},
					swLocation: {
						lat: swLocation.lat,
						long: swLocation.long,
					},
				}),
			);

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
			this.logger.error(`Failed to update user location for ${userId}:`, error);
			socket.emit('error', { message: 'Failed to update location' });
		}
	}
}

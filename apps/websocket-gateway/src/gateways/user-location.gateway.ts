import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { UpdateUserLocationData, UpdateUserLocationDataSchema } from '@app/apitypes';
import { LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { SchemaValidatorPipe } from '@app/nest/pipes';
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
import { UserConnectionManagerService } from '../services/user-connection-manager.service';

@Injectable()
@WebSocketGateway({ namespace: '/user' })
export class UserLocationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(UserLocationGateway.name);
	private locationService!: LocationServiceClient;

	constructor(
		@Inject(LOCATION_SERVICE_NAME) private readonly grpcClient: ClientGrpc,
		private readonly connectionManager: UserConnectionManagerService,
	) {}

	afterInit() {
		this.locationService = this.grpcClient.getService<LocationServiceClient>(LOCATION_SERVICE_NAME);
	}

	@WebSocketServer() server!: Server;

	async handleConnection(client: Socket) {
		this.logger.log(`User client connected: ${client.id}`);

		// Handle user registration
		client.on('register-user', async (data) => {
			if (data.userId) {
				await this.connectionManager.registerUser(data.userId, client.id);
				this.logger.log(`User ${data.userId} registered with socket ${client.id}`);
			}
		});
	}

	async handleDisconnect(client: Socket) {
		this.logger.log(`User client disconnected: ${client.id}`);
		await this.connectionManager.handleDisconnect(client.id);
	}

	@SubscribeMessage('updateUserLocation')
	async updateUserLocation(
		@MessageBody(new SchemaValidatorPipe(UpdateUserLocationDataSchema)) data: UpdateUserLocationData,
		@ConnectedSocket() socket: Socket,
	) {
		const userId = await this.connectionManager.getSocketUserId(socket.id);
		if (!userId) {
			this.logger.error('No user ID found for socket');
			return;
		}

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
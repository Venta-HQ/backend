import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';
import {
	UpdateUserLocationData,
	UpdateUserLocationDataSchema,
	VendorLocationUpdateData,
	VendorLocationUpdateDataSchema,
} from '@app/apitypes';
import { WsSchemaValidatorPipe } from '@app/nest/pipes';
import { LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ConnectionManagerService } from '../services/connection-manager.service';
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

@Injectable()
@WebSocketGateway()
export class LocationWebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(WebSocketGateway.name);
	private locationService: LocationServiceClient;

	constructor(
		@Inject(LOCATION_SERVICE_NAME) private readonly grpcClient: ClientGrpc,
		private readonly connectionManager: ConnectionManagerService,
	) {}

	afterInit() {
		this.locationService = this.grpcClient.getService<LocationServiceClient>(LOCATION_SERVICE_NAME);
	}

	@WebSocketServer() server: Server;

	async handleConnection(client: Socket) {
		// Keep a way to retrieve a user's socket id by userId
		client.on('register-user', async (data) => {
			if (data.userId) {
				await this.connectionManager.registerUser(data.userId, client.id);
			}
		});

		// When a vendor connects, store a record with their client ID
		client.on('register-vendor', async (data) => {
			if (data.vendorId) {
				await this.connectionManager.registerVendor(data.vendorId, client.id);
			}
		});
	}

	async handleDisconnect(client: any) {
		await this.connectionManager.handleDisconnect(client.id);
	}

	@SubscribeMessage('updateVendorLocation')
	async updateVendorLocation(
		@MessageBody(new WsSchemaValidatorPipe(VendorLocationUpdateDataSchema)) data: VendorLocationUpdateData,
		@ConnectedSocket() socket: Socket,
	) {
		const vendorId = await this.connectionManager.getSocketVendorId(socket.id);
		// Store this in DB & REDIS for querying later
		try {
			this.locationService
				.updateVendorLocation({
					entityId: vendorId,
					location: {
						lat: data.lat,
						long: data.long,
					},
				})
				.subscribe();
		} catch (e) {
			this.logger.error(e);
		}

		// Let any interested clients know
		socket.to(vendorId).emit('vendor_sync', {
			id: vendorId,
			location: {
				lat: data.lat,
				long: data.long,
			},
		});
	}

	@SubscribeMessage('updateUserLocation')
	async updateUserLocation(
		@MessageBody(new WsSchemaValidatorPipe(UpdateUserLocationDataSchema)) data: UpdateUserLocationData,
		@ConnectedSocket() socket: Socket,
	) {
		const { neLocation, swLocation } = data;
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

		const userId = await this.connectionManager.getSocketUserId(socket.id);
		const currentRooms = await this.connectionManager.getUserVendorRooms(userId);

		const vendorIds = (vendors ?? []).map((vendor) => vendor.id);

		// Find all the rooms you no longer need
		const roomsToLeave = currentRooms.filter((room) => !vendorIds.includes(room));
		// Find all the vendors whose rooms you are not subscribed to already
		const roomsToJoin = vendorIds.filter((room) => !currentRooms.includes(room));

		if (roomsToLeave.length) {
			roomsToLeave.forEach(async (room) => {
				await this.connectionManager.removeUserFromVendorRoom(userId, room);
				socket.leave(room);
			});
		}

		if (roomsToJoin.length) {
			roomsToJoin.forEach(async (room) => {
				await this.connectionManager.addUserToVendorRoom(userId, room);
				socket.join(room);
			});
		}

		socket.emit('vendor_channels', vendors ?? []);
	}
}

import Redis from 'ioredis';
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

@Injectable()
@WebSocketGateway()
export class LocationWebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(WebSocketGateway.name);
	private locationService: LocationServiceClient;

	constructor(
		@Inject(LOCATION_SERVICE_NAME) private readonly grpcClient: ClientGrpc,
		@InjectRedis() private readonly redis: Redis,
	) {}

	afterInit() {
		this.locationService = this.grpcClient.getService<LocationServiceClient>(LOCATION_SERVICE_NAME);
	}

	@WebSocketServer() server: Server;

	async handleConnection(client: Socket) {
		// Keep a way to retrieve a user's socket id by userId
		client.on('register-user', async (data) => {
			if (data.userId) {
				await this.redis.set(`user:${data.userId}:socketId`, client.id);
				await this.redis.set(`user:${client.id}`, data.userId);
			}
		});

		// When a vendor connects, store a record with their client ID
		client.on('register-vendor', async (data) => {
			if (data.vendorId) {
				await this.redis.set(`vendor:${client.id}`, data.vendorId);
			}
		});
	}

	async handleDisconnect(client: any) {
		// When a vendor disconnects, clear out
		const vendorId = await this.redis.get(`vendor:${client.id}`);
		const userId = await this.redis.get(`user:${client.id}`);
		if (vendorId) {
			// Remove the geolocation store
			this.redis.zrem('vendor_locations', vendorId);
			// Get all users in the room
			const usersInRoom = await this.redis.smembers(`room:${vendorId}:users`);
			// Let any interested clients know (Need to do this before disconnecting from room)
			client.to(vendorId).emit('vendor_disconnect', {
				id: vendorId,
			});
			usersInRoom.forEach(async (uid) => {
				// Get that user's socket id
				const socketId = await this.redis.get(`user:${uid}:socketId`);
				if (socketId) {
					// Get the socket
					const socket = this.server.sockets.sockets.get(socketId);
					if (socket) {
						// Have the socket leave this vendor's room
						socket.leave(vendorId);
					}
				}
				// Update redis to remove that room from the user's list of rooms
				await this.redis.srem(`user:${uid}:room`, vendorId);
			});
			// Delete room record
			await this.redis.del(`room:${vendorId}:users`);
			// Delete the vendor
			await this.redis.del(`vendor:${client.id}`);
		} else if (userId) {
			// Remove this user from any room user lists it is a part of
			const rooms = await this.redis.smembers(`user:${userId}:room`);
			rooms.forEach(async (room) => {
				await this.redis.srem(`room:${room}:users`, userId);
			});
			// Remove userId -> Socket ID connection
			await this.redis.del(`user:${userId}:socketId`);
			// Remove this user's list of rooms
			await this.redis.del(`user:${userId}:room`);
			// Remove user record
			await this.redis.del(`user:${client.id}`);
		}
	}

	@SubscribeMessage('updateVendorLocation')
	async updateVendorLocation(
		@MessageBody(new WsSchemaValidatorPipe(VendorLocationUpdateDataSchema)) data: VendorLocationUpdateData,
		@ConnectedSocket() socket: Socket,
	) {
		const vendorId = await this.redis.get(`vendor:${socket.id}`);
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

		const userId = await this.redis.get(`user:${socket.id}`);
		const currentRooms = await this.redis.smembers(`user:${userId}:room`);

		const vendorIds = (vendors ?? []).map((vendor) => vendor.id);

		// Find all the rooms you no longer need
		const roomsToLeave = currentRooms.filter((room) => !vendorIds.includes(room));
		// Find all the vendors whose rooms you are not subscribed to already
		const roomsToJoin = vendorIds.filter((room) => !currentRooms.includes(room));

		if (roomsToLeave.length) {
			this.redis.srem(`user:${userId}:room`, ...roomsToLeave);
			roomsToLeave.forEach((room) => {
				this.redis.srem(`room:${room}:users`, userId);
				socket.leave(room);
			});
		}

		if (roomsToJoin.length) {
			this.redis.sadd(`user:${userId}:room`, ...roomsToJoin);
			roomsToJoin.forEach((room) => {
				this.redis.sadd(`room:${room}:users`, userId);
				socket.join(room);
			});
		}

		socket.emit('vendor_channels', vendors ?? []);
	}
}

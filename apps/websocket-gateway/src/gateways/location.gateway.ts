import Redis from 'ioredis';
import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';
import {
	UpdateUserLocationData,
	UpdateUserLocationDataSchema,
	VendorLocationUpdateData,
	VendorLocationUpdateDataSchema,
} from '@app/apitypes';
import {
	GrpcLocationCreateDataSchema,
	GrpcLocationLookupDataSchema,
	GrpcLocationUpdateDataSchema,
} from '@app/apitypes/lib/location/location.schemas';
import { AppError, ErrorCodes } from '@app/errors';
import GrpcInstance from '@app/grpc';
import {
	LOCATION_SERVICE_NAME,
	LocationCreateData,
	LocationCreateResponse,
	LocationLookupByIdResponse,
	LocationLookupData,
	LocationUpdateData,
	LocationUpdateResponse,
} from '@app/proto/location';
import { SchemaValidatorPipe } from '@app/validation';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Inject, Injectable, Logger, UsePipes } from '@nestjs/common';
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

	onModuleInit() {
		this.locationService = this.grpcClient.getService<LocationServiceClient>('LocationService');
	}

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

	@SubscribeMessage('updateVendorLocation')
	async handleUpdateVendorLocation(
		@ConnectedSocket() client: Socket,
		@MessageBody(new SchemaValidatorPipe(VendorLocationUpdateDataSchema)) data: VendorLocationUpdateData,
	) {
		try {
			this.logger.log(`Updating vendor location for vendor ${data.vendorId}`);
			const result = await firstValueFrom(
				this.locationService.updateLocation({
					entityId: data.vendorId,
					location: data.location,
				}),
			);
			client.emit('vendorLocationUpdated', result);
		} catch (error) {
			this.logger.error('Error updating vendor location:', error);
			client.emit('error', { message: 'Failed to update vendor location' });
		}
	}

	@SubscribeMessage('updateUserLocation')
	async handleUpdateUserLocation(
		@ConnectedSocket() client: Socket,
		@MessageBody(new SchemaValidatorPipe(UpdateUserLocationDataSchema)) data: UpdateUserLocationData,
	) {
		try {
			this.logger.log(`Updating user location for user ${data.userId}`);
			const result = await firstValueFrom(
				this.locationService.updateLocation({
					entityId: data.userId,
					location: data.location,
				}),
			);
			client.emit('userLocationUpdated', result);
		} catch (error) {
			this.logger.error('Error updating user location:', error);
			client.emit('error', { message: 'Failed to update user location' });
		}
	}
}

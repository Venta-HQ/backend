import { firstValueFrom } from 'rxjs';
import { Socket } from 'socket.io';
import {
	UpdateUserLocationData,
	UpdateUserLocationDataSchema,
	VendorLocationUpdateData,
	VendorLocationUpdateDataSchema,
} from '@app/apitypes';
import { LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { SchemaValidatorPipe } from '@app/validation';
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
} from '@nestjs/websockets';

@Injectable()
@WebSocketGateway()
export class LocationWebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(LocationWebsocketGateway.name);
	private locationService!: LocationServiceClient;

	constructor(@Inject(LOCATION_SERVICE_NAME) private readonly grpcClient: ClientGrpc) {}

	onModuleInit() {
		this.locationService = this.grpcClient.getService<LocationServiceClient>('LocationService');
	}

	afterInit() {
		this.logger.log('WebSocket Gateway initialized');
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
				this.locationService.updateVendorLocation({
					entityId: data.vendorId,
					location: {
						lat: data.lat,
						long: data.long,
					},
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
				this.locationService.updateVendorLocation({
					entityId: data.userId || '',
					location: {
						lat: data.neLocation.lat,
						long: data.neLocation.long,
					},
				}),
			);
			client.emit('userLocationUpdated', result);
		} catch (error) {
			this.logger.error('Error updating user location:', error);
			client.emit('error', { message: 'Failed to update user location' });
		}
	}
}

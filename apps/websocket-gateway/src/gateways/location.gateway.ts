import { Server, Socket } from 'socket.io';
import {
	GenericLocationSyncData,
	GenericLocationSyncDataSchema,
	VendorLocationsRequestData,
	VendorLocationsRequestDataSchema,
} from '@app/apitypes';
import { WsSchemaValidatorPipe } from '@app/nest/pipes';
import { LocationServiceClient } from '@app/proto/location';
import { Inject, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';

@WebSocketGateway()
export class LocationWebsocketGateway implements OnGatewayInit {
	private readonly logger = new Logger(WebSocketGateway.name);
	private locationService: LocationServiceClient;

	constructor(@Inject('LOCATION_SERVICE') private grpcClient: ClientGrpc) {}

	@WebSocketServer() server: Server;

	afterInit(_server: Server) {
		this.locationService = this.grpcClient.getService<LocationServiceClient>('LocationService');
	}

	@SubscribeMessage('vendor_location_update')
	async vendorLocationSync(
		@MessageBody(new WsSchemaValidatorPipe(GenericLocationSyncDataSchema)) data: GenericLocationSyncData,
		@ConnectedSocket() _client: Socket,
	): Promise<void> {
		await this.locationService.updateVendorLocation({
			entityId: data.id,
			location: {
				lat: data.lat,
				long: data.long,
			},
		});
	}

	@SubscribeMessage('user_location_update')
	async userLocationSync(
		@MessageBody(new WsSchemaValidatorPipe(VendorLocationsRequestDataSchema)) data: VendorLocationsRequestData,
		@ConnectedSocket() client: Socket,
	): Promise<void> {
		const { neLocation, swLocation } = data;
		if (!neLocation.lat || !neLocation.long || !swLocation.lat || !swLocation.long) {
			this.server.to(client.id).emit('error', {
				message: 'Bounding box not provided.',
			});
			return;
		}

		this.locationService
			.vendorLocations({
				neLocation: {
					lat: neLocation.lat,
					long: neLocation.long,
				},
				swLocation: {
					lat: swLocation.lat,
					long: swLocation.long,
				},
			})
			.subscribe({
				complete: () => {
					console.log('gRPC stream completed');
				},
				error: (err) => {
					console.error('Error receiving gRPC response:', err);
				},
				next: (response) => {
					// Emit the response to the WebSocket
					this.server.to(client.id).emit('vendor_sync', response.vendors);
				},
			});
	}
}

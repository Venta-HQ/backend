import { ReplaySubject } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { GenericLocationSyncData, GenericLocationSyncDataSchema } from '@app/apitypes';
import { WsSchemaValidatorPipe } from '@app/nest/pipes';
import { LocationServiceClient, VendorLocationRequest } from '@app/proto/location';
import { Inject, Logger } from '@nestjs/common';
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

@WebSocketGateway()
export class LocationWebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(WebSocketGateway.name);
	private locationService: LocationServiceClient;
	private vendorLocationRequest$ = new ReplaySubject<VendorLocationRequest>();

	constructor(@Inject('LOCATION_SERVICE') private grpcClient: ClientGrpc) {}

	@WebSocketServer() server: Server;

	afterInit(_server: Server) {
		this.logger.log('Initializing websocket gateway');
		this.locationService = this.grpcClient.getService<LocationServiceClient>('LocationService');
		this.setUpVendorLocationStream();
		this.logger.log('Initialized websocket gateway');
	}

	setUpVendorLocationStream() {
		const stream = this.locationService.vendorLocations(this.vendorLocationRequest$);

		stream.subscribe({
			complete: () => {
				this.logger.log('Disconnecting from location service stream');
			},
			next: ({ callerId, vendors }) => {
				this.server.to(callerId).emit('vendor_sync', vendors);
			},
			error: (error) => {
				this.logger.error('Error in location service stream', error);
			}
		});
	}

	handleConnection(_client: Socket) {}
	handleDisconnect(_client: Socket) {}

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
		@MessageBody(new WsSchemaValidatorPipe(GenericLocationSyncDataSchema)) data: GenericLocationSyncData,
		@ConnectedSocket() client: Socket,
	): Promise<void> {
		this.vendorLocationRequest$.next({
			callerId: client.id,
			location: {
				lat: data.lat,
				long: data.long,
			},
		});
	}
}

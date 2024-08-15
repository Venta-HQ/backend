import { join } from 'path';
import { LoggerModule } from '@app/nest/modules/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WebsocketsGateway } from './websocket.gateway';

@Module({
	imports: [
		ConfigModule.forRoot(),
		LoggerModule.register('DB Change Microservice'),
		ClientsModule.register({
			clients: [
				{
					name: 'LOCATION_SERVICE',
					options: {
						package: 'location',
						protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
						url: 'localhost:5001',
					},
					transport: Transport.GRPC,
				},
			],
		}),
	],
	providers: [WebsocketsGateway],
})
export class WebsocketGatewayModule {}

import { join } from 'path';
import { WsExceptionFilter } from '@app/nest/filters';
import { LoggerModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LocationWebsocketGateway } from './gateways/location.gateway';

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
	providers: [
		{
			provide: APP_FILTER,
			useClass: WsExceptionFilter,
		},
		LocationWebsocketGateway,
	],
})
export class WebsocketGatewayModule {}

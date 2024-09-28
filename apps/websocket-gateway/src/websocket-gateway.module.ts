import { join } from 'path';
import { WsExceptionFilter } from '@app/nest/filters';
import { HttpLoggerModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LocationWebsocketGateway } from './gateways/location.gateway';

@Module({
	imports: [
		ConfigModule.forRoot(),
		HttpLoggerModule.register('Websocket Gateway Microservice'),
		RedisModule,
		ClientsModule.registerAsync({
			clients: [
				{
					imports: [ConfigModule],
					inject: [ConfigService],
					name: 'LOCATION_SERVICE',
					useFactory: (configService: ConfigService) => ({
						options: {
							package: 'location',
							protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
							url: configService.get('LOCATION_SERVICE_ADDRESS'),
						},
						transport: Transport.GRPC,
					}),
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

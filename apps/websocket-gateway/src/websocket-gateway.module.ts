import { join } from 'path';
import { WsErrorFilter } from '@app/nest/filters';
import { EventsModule, HealthModule, HttpLoggerModule, RedisModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LocationWebsocketGateway } from './gateways/location.gateway';
import { ConnectionManagerService } from './services/connection-manager.service';

@Module({
	imports: [
		ConfigModule.forRoot(),
		RedisModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'websocket-gateway-service',
		}),
		HttpLoggerModule.register('Websocket Gateway Microservice'),
		ClientsModule.registerAsync({
			clients: [
				{
					imports: [ConfigModule],
					inject: [ConfigService],
					name: LOCATION_SERVICE_NAME,
					useFactory: (configService: ConfigService) => ({
						options: {
							package: LOCATION_PACKAGE_NAME,
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
			useClass: WsErrorFilter,
		},
		ConnectionManagerService,
		LocationWebsocketGateway,
	],
})
export class WebsocketGatewayModule {}

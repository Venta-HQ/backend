import { join } from 'path';
import { WsExceptionFilter } from '@app/nest/filters';
import { GrpcInstanceModule, HttpLoggerModule, RedisModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LocationWebsocketGateway } from './gateways/location.gateway';

@Module({
	imports: [
		ConfigModule.forRoot(),
		HttpLoggerModule.register('Websocket Gateway Microservice'),
		RedisModule,
		GrpcInstanceModule.register<LocationServiceClient>({
			protoPackage: LOCATION_PACKAGE_NAME,
			protoPath: join(__dirname, `../proto/src/definitions/vendor.proto`),
			provide: LOCATION_SERVICE_NAME,
			serviceName: LOCATION_SERVICE_NAME,
			urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
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

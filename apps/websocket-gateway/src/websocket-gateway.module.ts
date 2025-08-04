import { join } from 'path';
import { ErrorHandlingModule } from '@app/nest/errors';
import { WsErrorFilter } from '@app/nest/filters';
import { 
	WsAuthGuard,
	WsRateLimitGuardLenient, 
	WsRateLimitGuardStandard, 
	WsRateLimitGuardStatus, 
	WsRateLimitGuardStrict 
} from '@app/nest/guards';
import {
	ClerkModule,
	ConfigModule,
	EventsModule,
	HealthModule,
	LoggerModule,
	PrismaModule,
	RedisModule,
} from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserLocationGateway } from './gateways/user-location.gateway';
import { VendorLocationGateway } from './gateways/vendor-location.gateway';
import { ConnectionHealthService } from './services/connection-health.service';
import { UserConnectionManagerService } from './services/user-connection-manager.service';
import { VendorConnectionManagerService } from './services/vendor-connection-manager.service';

@Module({
	imports: [
		ConfigModule,
		ErrorHandlingModule,
		RedisModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'websocket-gateway-service',
		}),
		LoggerModule.register({ appName: 'Websocket Gateway Microservice', protocol: 'http' }),
		ClerkModule.register(),
		PrismaModule.register(),
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
		UserConnectionManagerService,
		VendorConnectionManagerService,
		ConnectionHealthService,
		UserLocationGateway,
		VendorLocationGateway,
		// Authentication and rate limiting guards
		WsAuthGuard,
		WsRateLimitGuardLenient,
		WsRateLimitGuardStandard,
		WsRateLimitGuardStatus,
		WsRateLimitGuardStrict,
	],
})
export class WebsocketGatewayModule {}

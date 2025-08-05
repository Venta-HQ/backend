import { join } from 'path';
import { WsErrorFilter } from '@app/nest/filters';
import {
	WsAuthGuard,
	WsRateLimitGuardLenient,
	WsRateLimitGuardStandard,
	WsRateLimitGuardStatus,
	WsRateLimitGuardStrict,
} from '@app/nest/guards';
import { BootstrapModule, ClerkModule, GrpcInstanceModule, PrometheusService, RedisModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserLocationGateway } from './gateways/user-location.gateway';
import { VendorLocationGateway } from './gateways/vendor-location.gateway';
import { createWebSocketMetrics, WEBSOCKET_METRICS } from './metrics.provider';
import { UserConnectionManagerService } from './services/user-connection-manager.service';
import { VendorConnectionManagerService } from './services/vendor-connection-manager.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [
				RedisModule,
				ClerkModule.register(),
				GrpcInstanceModule.register<LocationServiceClient>({
					protoPackage: LOCATION_PACKAGE_NAME,
					protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
					provide: LOCATION_SERVICE_NAME,
					serviceName: LOCATION_SERVICE_NAME,
					urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
				}),
				ClientsModule.registerAsync({
					clients: [
						{
							imports: [ConfigModule],
							inject: [ConfigService],
							name: 'NATS_SERVICE',
							useFactory: (configService: ConfigService) => ({
								options: {
									servers: configService.get('NATS_URL') || 'nats://localhost:4222',
								},
								transport: Transport.NATS,
							}),
						},
					],
				}),
			],
			appName: 'Websocket Gateway Microservice',
			protocol: 'http',
		}),
	],
	providers: [
		{
			provide: APP_FILTER,
			useClass: WsErrorFilter,
		},
		{
			inject: [PrometheusService],
			provide: WEBSOCKET_METRICS,
			useFactory: createWebSocketMetrics,
		},
		UserConnectionManagerService,
		VendorConnectionManagerService,
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

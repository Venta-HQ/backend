import {
	WsAuthGuard,
	WsRateLimitGuardLenient,
	WsRateLimitGuardStandard,
	WsRateLimitGuardStatus,
	WsRateLimitGuardStrict,
} from '@app/nest/guards';
import { APP_NAMES, BootstrapModule, ClerkModule, GrpcInstanceModule, PrometheusService, RedisModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
				ConfigModule,
				GrpcInstanceModule.register<LocationServiceClient>({
					proto: 'location.proto',
					protoPackage: LOCATION_PACKAGE_NAME,
					provide: LOCATION_SERVICE_NAME,
					serviceName: LOCATION_SERVICE_NAME,
					urlFactory: (configService: ConfigService) =>
						configService.get('LOCATION_SERVICE_ADDRESS') || 'localhost:5001',
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
			appName: APP_NAMES.WEBSOCKET_GATEWAY,
			protocol: 'http',
		}),
	],
	providers: [
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

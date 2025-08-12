import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
	WsAuthGuard,
	WsRateLimitGuardLenient,
	WsRateLimitGuardStandard,
	WsRateLimitGuardStatus,
	WsRateLimitGuardStrict,
} from '@venta/nest/guards';
import {
	APP_NAMES,
	BootstrapModule,
	ClerkModule,
	GrpcInstanceModule,
	PrometheusService,
	RedisModule,
} from '@venta/nest/modules';
import {
	GEOLOCATION_SERVICE_NAME,
	GeolocationServiceClient,
	LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME,
} from '@venta/proto/location-services/geolocation';
import { createWebSocketMetrics, WEBSOCKET_METRICS } from './metrics.provider';
import { UserLocationGateway } from './user/user.gateway';
import { UserConnectionManagerService } from './user/user.manager';
import { VendorLocationGateway } from './vendor/vendor.gateway';
import { VendorConnectionManagerService } from './vendor/vendor.manager';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [
				RedisModule,
				ClerkModule.register(),
				ConfigModule,
				GrpcInstanceModule.register<GeolocationServiceClient>({
					proto: 'geolocation.proto',
					protoPackage: LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME,
					provide: GEOLOCATION_SERVICE_NAME,
					serviceName: GEOLOCATION_SERVICE_NAME,
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
			appName: APP_NAMES.LOCATION_GATEWAY,
			protocol: 'websocket',
		}),
	],
	providers: [
		{
			inject: [PrometheusService],
			provide: WEBSOCKET_METRICS,
			useFactory: createWebSocketMetrics,
		},
		// Gateways
		UserLocationGateway,
		VendorLocationGateway,
		// Connection Managers
		UserConnectionManagerService,
		VendorConnectionManagerService,
		// Authentication and rate limiting guards
		WsAuthGuard,
		WsRateLimitGuardLenient,
		WsRateLimitGuardStandard,
		WsRateLimitGuardStatus,
		WsRateLimitGuardStrict,
	],
})
export class LocationGatewayModule {}

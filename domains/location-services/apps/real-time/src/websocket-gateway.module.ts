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
// TODO: Fix proto imports when geolocation proto is available
// import {
// 	GEOLOCATION_PACKAGE_NAME,
// 	GEOLOCATION_SERVICE_NAME,
// 	GeolocationServiceClient,
// } from '@venta/proto/location-services/geolocation';
import { UserLocationGateway } from './core/gateways/user-location.gateway';
import { VendorLocationGateway } from './core/gateways/vendor-location.gateway';
import { createWebSocketMetrics, WEBSOCKET_METRICS } from './core/metrics.provider';
import { UserConnectionManagerService } from './core/user-connection-manager.service';
import { VendorConnectionManagerService } from './core/vendor-connection-manager.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [
				RedisModule,
				ClerkModule.register(),
				ConfigModule,
				// TODO: Add geolocation gRPC client when needed
				// GrpcInstanceModule.register<any>({
				// 	proto: 'location.proto',
				// 	protoPackage: 'geolocation',
				// 	provide: 'GEOLOCATION_SERVICE',
				// 	urlFactory: (configService: ConfigService) =>
				// 		configService.get('LOCATION_SERVICE_ADDRESS') || 'localhost:5001',
				// }),
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

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule, WsAuthGuard } from '@venta/nest/guards';
import { APP_NAMES, BootstrapModule, GrpcInstanceModule, PrometheusService } from '@venta/nest/modules';
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
			appName: APP_NAMES.LOCATION_GATEWAY,
			protocol: 'websocket',
		}),
		ConfigModule,
		AuthModule,
		GrpcInstanceModule.register<GeolocationServiceClient>({
			proto: 'geolocation.proto',
			protoPackage: LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME,
			provide: GEOLOCATION_SERVICE_NAME,
			serviceName: GEOLOCATION_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('LOCATION_SERVICE_ADDRESS') || 'localhost:5001',
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
		ThrottlerModule.forRoot([
			{
				name: 'ws-user',
				ttl: 60_000,
				limit: 15,
			},
		]),
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
		// Authentication guard and global throttler guard
		WsAuthGuard,
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
	],
})
export class LocationGatewayModule {}

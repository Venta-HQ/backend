import Redis from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@venta/nest/guards';
import { APP_NAMES, BootstrapModule, EventsModule, GrpcInstanceModule, PrometheusService } from '@venta/nest/modules';
import { PresenceService } from '@venta/nest/websocket';
import {
	GEOLOCATION_SERVICE_NAME,
	LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME,
} from '@venta/proto/location-services/geolocation';
import { createWebSocketMetrics, WEBSOCKET_METRICS } from './metrics.provider';
import { UserLocationGateway } from './user/user.gateway';
import { VendorLocationGateway } from './vendor/vendor.gateway';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.LOCATION_GATEWAY,
			protocol: 'websocket',
		}),
		ConfigModule,
		AuthModule,
		EventsModule.register(),
		GrpcInstanceModule.register({
			provide: GEOLOCATION_SERVICE_NAME,
			proto: 'domains/location-services/geolocation.proto',
			protoPackage: LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME,
			serviceName: GEOLOCATION_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('LOCATION_SERVICE_ADDRESS') || 'localhost:5002',
		}),
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const redisUrl = configService.get('REDIS_URL') || 'redis://localhost:6379';
				const redis = new Redis(redisUrl);
				return {
					throttlers: [
						{
							name: 'default',
							ttl: 60_000,
							limit: 30,
						},
					],
					storage: new ThrottlerStorageRedisService(redis),
				};
			},
		}),
	],
	providers: [
		{
			provide: WEBSOCKET_METRICS,
			inject: [PrometheusService],
			useFactory: (prom: PrometheusService) => createWebSocketMetrics(prom),
		},
		// WebSocket utilities
		PresenceService,
		// Gateways
		UserLocationGateway,
		VendorLocationGateway,
		// No connection managers needed (rooms via Socket.IO; presence via PresenceService)
	],
})
export class LocationGatewayModule {}

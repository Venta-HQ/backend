import Redis from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@venta/nest/guards';
import { APP_NAMES, BootstrapModule, EventsModule, PrometheusService } from '@venta/nest/modules';
import { createWebSocketMetrics, WEBSOCKET_METRICS } from './metrics.provider';
import { UserLocationGateway } from './user/user.gateway';
import { UserConnectionManagerService } from './user/user.manager';
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
		// Gateways
		UserLocationGateway,
		VendorLocationGateway,
		// Connection Manager (user rooms only)
		UserConnectionManagerService,
	],
})
export class LocationGatewayModule {}

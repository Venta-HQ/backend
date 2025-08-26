import Redis from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule, WsThrottlerGuard } from '@venta/nest/guards';
import { APP_NAMES, BootstrapModule, PrometheusService } from '@venta/nest/modules';
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
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const redisUrl = configService.get('REDIS_URL') || 'redis://localhost:6379';
				const redis = new Redis(redisUrl);
				return {
					throttlers: [
						{
							name: 'ws-user',
							ttl: 60_000,
							limit: 15,
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
		// Connection Managers
		UserConnectionManagerService,
		VendorConnectionManagerService,
		// Global throttler guard (WS)
		{ provide: APP_GUARD, useClass: WsThrottlerGuard },
	],
})
export class LocationGatewayModule {}

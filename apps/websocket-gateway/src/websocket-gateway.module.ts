import { join } from 'path';
import { WsErrorFilter } from '@app/nest/filters';
import {
	WsAuthGuard,
	WsRateLimitGuardLenient,
	WsRateLimitGuardStandard,
	WsRateLimitGuardStatus,
	WsRateLimitGuardStrict,
} from '@app/nest/guards';
import { BootstrapModule, ClerkModule, PrometheusService, RedisModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
				ClientsModule.registerAsync({
					clients: [
						{
							imports: [BootstrapModule],
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
			appName: 'WebSocket Gateway Service',
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

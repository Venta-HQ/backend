import { BootstrapModule, EventService, PrismaModule, PrometheusService, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserLocationGateway } from './gateways/user-location.gateway';
import { VendorLocationGateway } from './gateways/vendor-location.gateway';
import { createWebSocketMetrics, WEBSOCKET_METRICS } from './metrics.provider';
import { UserConnectionManagerService } from './services/user-connection-manager.service';
import { VendorConnectionManagerService } from './services/vendor-connection-manager.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'real-time',
			domain: 'location-services',
			protocol: 'websocket',
		}),
		ConfigModule,
		PrismaModule,
		RedisModule,
	],
	providers: [
		UserLocationGateway,
		VendorLocationGateway,
		UserConnectionManagerService,
		VendorConnectionManagerService,
		EventService,
		{
			provide: WEBSOCKET_METRICS,
			useFactory: (prometheusService: PrometheusService) => createWebSocketMetrics(prometheusService),
			inject: [PrometheusService],
		},
	],
})
export class RealTimeModule {}

import { WebSocketACL } from '@domains/location-services/contracts/anti-corruption-layers/realtime';
import { RealtimeToMarketplaceContextMapper } from '@domains/location-services/contracts/context-mappers/realtime';
import { LocationContractsModule } from '@domains/location-services/contracts/location-contracts.module';
import { Module } from '@nestjs/common';
import { PrometheusService } from '@venta/nest/modules';
import { UserLocationGateway } from './gateways/user-location.gateway';
import { VendorLocationGateway } from './gateways/vendor-location.gateway';
import { createWebSocketMetrics, WEBSOCKET_METRICS } from './metrics.provider';
import { UserConnectionManagerService } from './user-connection-manager.service';
import { VendorConnectionManagerService } from './vendor-connection-manager.service';

@Module({
	imports: [LocationContractsModule],
	providers: [
		UserLocationGateway,
		VendorLocationGateway,
		UserConnectionManagerService,
		VendorConnectionManagerService,
		WebSocketACL,
		RealtimeToMarketplaceContextMapper,
		{
			provide: WEBSOCKET_METRICS,
			useFactory: (prometheusService: PrometheusService) => createWebSocketMetrics(prometheusService),
			inject: [PrometheusService],
		},
	],
	exports: [UserLocationGateway, VendorLocationGateway, UserConnectionManagerService, VendorConnectionManagerService],
})
export class CoreModule {}

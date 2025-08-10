import { Module } from '@nestjs/common';
import { MarketplaceContractsModule } from '@venta/domains/marketplace/contracts';
import { AlgoliaModule, BootstrapModule, NatsQueueModule } from '@venta/nest/modules';
import { AlgoliaSyncController } from './algolia-sync.controller';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'search-discovery',
			domain: 'marketplace',
			protocol: 'nats',
		}),
		AlgoliaModule,
		NatsQueueModule,
		MarketplaceContractsModule,
	],
	providers: [AlgoliaSyncController, AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

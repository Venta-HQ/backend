import { Module } from '@nestjs/common';
import { AlgoliaModule, BootstrapModule, NatsQueueModule } from '@venta/nest/modules';
import { AlgoliaSyncController } from './algolia-sync.controller';
import { AlgoliaSyncService } from './algolia-sync.service';
import { AlgoliaACL } from './anti-corruption-layers/algolia-acl';
import { NatsACL } from './anti-corruption-layers/nats-acl.js';
import { SearchToMarketplaceContextMapper } from './context-mappers/search-to-marketplace-context-mapper';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'search-discovery',
			domain: 'marketplace',
			protocol: 'nats',
		}),
		AlgoliaModule,
		NatsQueueModule,
	],
	providers: [AlgoliaSyncController, AlgoliaSyncService, AlgoliaACL, NatsACL, SearchToMarketplaceContextMapper],
})
export class AlgoliaSyncModule {}

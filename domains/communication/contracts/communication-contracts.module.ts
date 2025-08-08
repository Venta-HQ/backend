import { PrometheusModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { CommunicationToMarketplaceContextMapper } from './context-mappers/communication-to-marketplace-context-mapper';

/**
 * Communication Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire communication domain (webhooks, notifications)
 */
@Module({
	imports: [PrometheusModule.register()],
	providers: [CommunicationToMarketplaceContextMapper],
	exports: [CommunicationToMarketplaceContextMapper],
})
export class CommunicationContractsModule {}

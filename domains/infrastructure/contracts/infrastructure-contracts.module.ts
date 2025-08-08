import { PrometheusModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { InfrastructureToMarketplaceContextMapper } from './context-mappers/infrastructure-to-marketplace-context-mapper';

/**
 * Infrastructure Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire infrastructure domain (api-gateway, file-management)
 */
@Module({
	imports: [PrometheusModule.register()],
	providers: [InfrastructureToMarketplaceContextMapper],
	exports: [InfrastructureToMarketplaceContextMapper],
})
export class InfrastructureContractsModule {}

import { Module } from '@nestjs/common';
import { ContractsModule } from '@app/nest/modules/contracts';

// Context Mappers
import { InfrastructureMarketplaceContextMapper } from './context-mappers/infrastructure-marketplace-context-mapper';

/**
 * Infrastructure Contracts Module
 * 
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire infrastructure domain (api-gateway, file-management)
 */
@Module({
	imports: [ContractsModule],
	providers: [
		// Context Mappers
		InfrastructureMarketplaceContextMapper,
	],
	exports: [
		// Context Mappers
		InfrastructureMarketplaceContextMapper,
	],
})
export class InfrastructureContractsModule {} 
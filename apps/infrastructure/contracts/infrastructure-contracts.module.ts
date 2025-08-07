import { Module } from '@nestjs/common';
import { InfrastructureMarketplaceContextMapper } from './context-mappers/infrastructure-marketplace-context-mapper';

/**
 * Infrastructure Contracts Module
 * 
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire infrastructure domain (api-gateway, file-management)
 */
@Module({
	providers: [InfrastructureMarketplaceContextMapper],
	exports: [InfrastructureMarketplaceContextMapper],
})
export class InfrastructureContractsModule {} 
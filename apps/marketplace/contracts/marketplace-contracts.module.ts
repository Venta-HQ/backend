import { ContractsModule } from '@app/nest/modules/contracts';
import { Module } from '@nestjs/common';
// Anti-Corruption Layers
import { ClerkAntiCorruptionLayer } from './anti-corruption-layers/clerk-anti-corruption-layer';
import { RevenueCatAntiCorruptionLayer } from './anti-corruption-layers/revenuecat-anti-corruption-layer';
import { MarketplaceCommunicationContextMapper } from './context-mappers/marketplace-communication-context-mapper';
import { MarketplaceInfrastructureContextMapper } from './context-mappers/marketplace-infrastructure-context-mapper';
// Context Mappers
import { MarketplaceLocationContextMapper } from './context-mappers/marketplace-location-context-mapper';
// Validation
import { ContextBoundaryValidationMiddleware } from './validation/context-boundary-validation.middleware';

/**
 * Marketplace Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire marketplace domain (user-management, vendor-management, search-discovery)
 */
@Module({
	imports: [ContractsModule],
	providers: [
		// Context Mappers
		MarketplaceLocationContextMapper,
		MarketplaceCommunicationContextMapper,
		MarketplaceInfrastructureContextMapper,

		// Anti-Corruption Layers
		ClerkAntiCorruptionLayer,
		RevenueCatAntiCorruptionLayer,

		// Validation
		ContextBoundaryValidationMiddleware,
	],
	exports: [
		// Context Mappers
		MarketplaceLocationContextMapper,
		MarketplaceCommunicationContextMapper,
		MarketplaceInfrastructureContextMapper,

		// Anti-Corruption Layers
		ClerkAntiCorruptionLayer,
		RevenueCatAntiCorruptionLayer,

		// Validation
		ContextBoundaryValidationMiddleware,
	],
})
export class MarketplaceContractsModule {}

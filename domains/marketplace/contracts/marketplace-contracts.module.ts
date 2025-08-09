import { Module } from '@nestjs/common';
// Anti-Corruption Layers
import { ClerkAntiCorruptionLayer } from './anti-corruption-layers/clerk.acl';
import { RevenueCatAntiCorruptionLayer } from './anti-corruption-layers/revenuecat.acl';
// Context Mappers
import * as MarketplaceToCommunication from './context-mappers/marketplace-to-communication-context-mapper';
import * as MarketplaceToInfrastructure from './context-mappers/marketplace-to-infrastructure-context-mapper';
import * as MarketplaceToLocation from './context-mappers/marketplace-to-location-context-mapper';

/**
 * Marketplace Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire marketplace domain (user-management, vendor-management, search-discovery)
 */
@Module({
	providers: [
		// Context Mappers (these files export functions; not DI providers)
		// We expose them via the barrel index for imports. Keep DI list to class providers only.

		// Anti-Corruption Layers
		ClerkAntiCorruptionLayer,
		RevenueCatAntiCorruptionLayer,
	],
	exports: [
		// Anti-Corruption Layers
		ClerkAntiCorruptionLayer,
		RevenueCatAntiCorruptionLayer,
	],
})
export class MarketplaceContractsModule {}

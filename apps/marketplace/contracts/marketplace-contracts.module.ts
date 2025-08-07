import { Module } from '@nestjs/common';
// Anti-Corruption Layers
import { ClerkAntiCorruptionLayer } from './anti-corruption-layers/clerk-anti-corruption-layer';
import { RevenueCatAntiCorruptionLayer } from './anti-corruption-layers/revenuecat-anti-corruption-layer';
// Context Mappers
import { MarketplaceLocationContextMapper } from './context-mappers/marketplace-location-context-mapper';

/**
 * Marketplace Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire marketplace domain (user-management, vendor-management, search-discovery)
 */
@Module({
	providers: [
		// Context Mappers
		MarketplaceLocationContextMapper,

		// Anti-Corruption Layers
		ClerkAntiCorruptionLayer,
		RevenueCatAntiCorruptionLayer,
	],
	exports: [
		// Context Mappers
		MarketplaceLocationContextMapper,

		// Anti-Corruption Layers
		ClerkAntiCorruptionLayer,
		RevenueCatAntiCorruptionLayer,
	],
})
export class MarketplaceContractsModule {}

import { Module } from '@nestjs/common';
import { ClerkAntiCorruptionLayer } from './clerk-anti-corruption-layer';
import { RevenueCatAntiCorruptionLayer } from './revenuecat-anti-corruption-layer';

/**
 * Anti-Corruption Layers Module
 *
 * Provides anti-corruption layer services for external integrations
 * to protect the Marketplace domain from external API changes
 */
@Module({
	providers: [ClerkAntiCorruptionLayer, RevenueCatAntiCorruptionLayer],
	exports: [ClerkAntiCorruptionLayer, RevenueCatAntiCorruptionLayer],
})
export class AntiCorruptionLayersModule {}

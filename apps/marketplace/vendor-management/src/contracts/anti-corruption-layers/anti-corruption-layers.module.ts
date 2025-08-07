import { Module } from '@nestjs/common';
import { VendorClerkAntiCorruptionLayer } from './vendor-clerk-anti-corruption-layer';
import { VendorRevenueCatAntiCorruptionLayer } from './vendor-revenuecat-anti-corruption-layer';

/**
 * Anti-Corruption Layers Module for Vendor Management
 * 
 * Organizes and exports all anti-corruption layer services for vendor management domain
 */
@Module({
	providers: [
		VendorClerkAntiCorruptionLayer,
		VendorRevenueCatAntiCorruptionLayer,
	],
	exports: [
		VendorClerkAntiCorruptionLayer,
		VendorRevenueCatAntiCorruptionLayer,
	],
})
export class VendorAntiCorruptionLayersModule {} 
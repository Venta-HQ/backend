import { Module } from '@nestjs/common';
import { LocationExternalServiceACL } from './anti-corruption-layers/location-external-service-acl';
import { LocationMarketplaceContextMapper } from './context-mappers/location-marketplace-context-mapper';

/**
 * Location Services Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire location services domain (geolocation, real-time)
 */
@Module({
	providers: [LocationMarketplaceContextMapper, LocationExternalServiceACL],
	exports: [LocationMarketplaceContextMapper, LocationExternalServiceACL],
})
export class LocationContractsModule {}

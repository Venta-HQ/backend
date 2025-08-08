import { PrometheusModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { LocationExternalServiceACL } from './anti-corruption-layers/location-external-service-acl';
import { LocationToMarketplaceContextMapper } from './context-mappers/location-to-marketplace-context-mapper';

/**
 * Location Services Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire location services domain (geolocation, real-time)
 */
@Module({
	imports: [PrometheusModule.register()],
	providers: [LocationToMarketplaceContextMapper, LocationExternalServiceACL],
	exports: [LocationToMarketplaceContextMapper, LocationExternalServiceACL],
})
export class LocationContractsModule {}

import { ContractsModule } from '@app/nest/modules/contracts';
import { Module } from '@nestjs/common';
// Anti-Corruption Layers
import { LocationExternalServiceACL } from './anti-corruption-layers/location-external-service-acl';
// Context Mappers
import { LocationMarketplaceContextMapper } from './context-mappers/location-marketplace-context-mapper';

/**
 * Location Services Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire location services domain (geolocation, real-time)
 */
@Module({
	imports: [ContractsModule],
	providers: [
		// Context Mappers
		LocationMarketplaceContextMapper,

		// Anti-Corruption Layers
		LocationExternalServiceACL,
	],
	exports: [
		// Context Mappers
		LocationMarketplaceContextMapper,

		// Anti-Corruption Layers
		LocationExternalServiceACL,
	],
})
export class LocationContractsModule {}

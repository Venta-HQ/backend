import { Module } from '@nestjs/common';
import { PrometheusModule } from '@venta/nest/modules';
import { LocationExternalServiceACL } from './anti-corruption-layers/location-external-service.acl';

/**
 * Location Services Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire location services domain (geolocation, real-time)
 */
@Module({
	imports: [PrometheusModule.register()],
	providers: [LocationExternalServiceACL],
	exports: [LocationExternalServiceACL],
})
export class LocationContractsModule {}

import { Module } from '@nestjs/common';
import { VendorLocationContextMapper } from './vendor-location-context-mapper';
import { VendorCommunicationContextMapper } from './vendor-communication-context-mapper';
import { VendorInfrastructureContextMapper } from './vendor-infrastructure-context-mapper';

/**
 * Context Mappers Module for Vendor Management
 * 
 * Organizes and exports all context mapping services for vendor management domain
 */
@Module({
	providers: [
		VendorLocationContextMapper,
		VendorCommunicationContextMapper,
		VendorInfrastructureContextMapper,
	],
	exports: [
		VendorLocationContextMapper,
		VendorCommunicationContextMapper,
		VendorInfrastructureContextMapper,
	],
})
export class VendorContextMappersModule {} 
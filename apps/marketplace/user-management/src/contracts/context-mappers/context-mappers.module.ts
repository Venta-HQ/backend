import { Module } from '@nestjs/common';
import { MarketplaceLocationContextMapper } from './marketplace-location-context-mapper';
import { MarketplaceCommunicationContextMapper } from './marketplace-communication-context-mapper';
import { MarketplaceInfrastructureContextMapper } from './marketplace-infrastructure-context-mapper';

/**
 * Context Mappers Module
 * 
 * Provides context mapping services for translating between Marketplace domain
 * and other bounded contexts (Location Services, Communication, Infrastructure)
 */
@Module({
	providers: [
		MarketplaceLocationContextMapper,
		MarketplaceCommunicationContextMapper,
		MarketplaceInfrastructureContextMapper,
	],
	exports: [
		MarketplaceLocationContextMapper,
		MarketplaceCommunicationContextMapper,
		MarketplaceInfrastructureContextMapper,
	],
})
export class ContextMappersModule {} 
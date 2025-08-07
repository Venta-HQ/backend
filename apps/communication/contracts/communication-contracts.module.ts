import { Module } from '@nestjs/common';
import { CommunicationMarketplaceContextMapper } from './context-mappers/communication-marketplace-context-mapper';

/**
 * Communication Contracts Module
 * 
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire communication domain (webhooks, notifications)
 */
@Module({
	providers: [CommunicationMarketplaceContextMapper],
	exports: [CommunicationMarketplaceContextMapper],
})
export class CommunicationContractsModule {} 
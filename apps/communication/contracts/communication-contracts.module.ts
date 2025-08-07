import { Module } from '@nestjs/common';
import { ContractsModule } from '@app/nest/modules/contracts';

// Context Mappers
import { CommunicationMarketplaceContextMapper } from './context-mappers/communication-marketplace-context-mapper';

/**
 * Communication Contracts Module
 * 
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire communication domain (webhooks, notifications)
 */
@Module({
	imports: [ContractsModule],
	providers: [
		// Context Mappers
		CommunicationMarketplaceContextMapper,
	],
	exports: [
		// Context Mappers
		CommunicationMarketplaceContextMapper,
	],
})
export class CommunicationContractsModule {} 
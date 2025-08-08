import { PrometheusModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';

/**
 * Communication Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire communication domain (webhooks, notifications)
 */
@Module({
	imports: [PrometheusModule.register()],
	providers: [],
	exports: [],
})
export class CommunicationContractsModule {}

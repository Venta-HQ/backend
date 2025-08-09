import { Module } from '@nestjs/common';
import { PrometheusModule } from '@venta/nest/modules';

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

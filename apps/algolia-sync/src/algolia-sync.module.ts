import { ErrorHandlingModule } from '@app/nest/errors';
import { AlgoliaModule, ConfigModule, EventsModule, HealthModule, LoggerModule, PrometheusModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	imports: [
		ConfigModule,
		ErrorHandlingModule,
		LoggerModule.register({ appName: 'Algolia Sync Service', protocol: 'http' }),
		EventsModule,
		PrometheusModule.register({ appName: 'algolia-sync' }),
		AlgoliaModule.register(),
		HealthModule.forRoot({
			additionalChecks: async () => {
				// Add any algolia-sync specific health checks here
				return {
					algoliaSync: 'operational',
				};
			},
			serviceName: 'algolia-sync-service',
		}),
	],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

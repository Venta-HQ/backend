import { EventsModule, HealthModule, LoggerModule, AlgoliaModule, ConfigModule } from '@app/nest/modules';
import { ErrorHandlingModule } from '@app/nest/errors';
import { Module } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	imports: [
		ConfigModule,
		ErrorHandlingModule,
		LoggerModule.register({ appName: 'Algolia Sync Service', protocol: 'http' }),
		EventsModule,
		AlgoliaModule.register(),
		HealthModule.forRoot({
			serviceName: 'algolia-sync-service',
			additionalChecks: async () => {
				// Add any algolia-sync specific health checks here
				return {
					algoliaSync: 'operational',
				};
			},
		}),
	],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {} 
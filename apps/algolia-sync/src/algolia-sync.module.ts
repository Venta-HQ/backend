import { EventsModule, HealthModule, LoggerModule, AlgoliaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	imports: [
		ConfigModule.forRoot(),
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
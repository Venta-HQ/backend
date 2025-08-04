import { AlgoliaModule, BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Algolia Sync Service',
			protocol: 'http',
			additionalModules: [AlgoliaModule.register()],
			healthChecks: async () => {
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

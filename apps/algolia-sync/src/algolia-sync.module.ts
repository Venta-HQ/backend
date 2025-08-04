import { AlgoliaModule, BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [AlgoliaModule.register()],
			appName: 'Algolia Sync Service',
			healthChecks: async () => {
				// Add any algolia-sync specific health checks here
				return {
					algoliaSync: 'operational',
				};
			},
			protocol: 'http',
		}),
	],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

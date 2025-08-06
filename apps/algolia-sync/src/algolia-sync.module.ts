import { AlgoliaModule, BootstrapModule, NatsQueueModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AlgoliaSyncController } from './algolia-sync.controller';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	controllers: [AlgoliaSyncController],
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [AlgoliaModule.register(), NatsQueueModule],
			appName: 'Algolia Sync Service',
			protocol: 'nats',
		}),
	],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

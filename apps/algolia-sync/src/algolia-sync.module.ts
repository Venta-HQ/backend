import { AlgoliaModule, NatsQueueModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AlgoliaSyncController } from './algolia-sync.controller';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	controllers: [AlgoliaSyncController],
	imports: [AlgoliaModule.register(), NatsQueueModule],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

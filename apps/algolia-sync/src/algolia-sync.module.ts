import { AlgoliaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	imports: [AlgoliaModule.register()],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

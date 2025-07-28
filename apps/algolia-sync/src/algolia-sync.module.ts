import { AlgoliaModule, EventsModule, HttpLoggerModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlgoliaSyncController } from './algolia-sync.controller';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	controllers: [AlgoliaSyncController],
	imports: [
		ConfigModule.forRoot(),
		HttpLoggerModule.register('Algolia Sync Service'),
		EventsModule,
		AlgoliaModule.register(),
	],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

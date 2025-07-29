import { EventsModule } from '@app/events';
import { LoggerModule } from '@app/logger';
import { AlgoliaModule } from '@app/search';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlgoliaSyncController } from './algolia-sync.controller';
import { AlgoliaSyncService } from './algolia-sync.service';

@Module({
	controllers: [AlgoliaSyncController],
	imports: [
		ConfigModule.forRoot(),
		LoggerModule.register({ appName: 'Algolia Sync Service', protocol: 'http' }),
		EventsModule,
		AlgoliaModule.register(),
	],
	providers: [AlgoliaSyncService],
})
export class AlgoliaSyncModule {}

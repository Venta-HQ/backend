import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AlgoliaService } from './algolia.service';

@Module({})
export class AlgoliaModule {
	static register(): DynamicModule {
		return {
			exports: [AlgoliaService],
			imports: [ConfigModule],
			module: AlgoliaModule,
			providers: [
				{
					inject: [ConfigService],
					provide: AlgoliaService,
					useFactory: (configService: ConfigService) => {
						if (!configService.get('ALGOLIA_APPLICATION_ID')) {
							throw new Error('ALGOLIA_APPLICATION_ID required');
						}
						if (!configService.get('ALGOLIA_API_KEY')) {
							throw new Error('ALGOLIA_API_KEY required');
						}

						return new AlgoliaService(
							configService.get('ALGOLIA_APPLICATION_ID'),
							configService.get('ALGOLIA_API_KEY'),
							new (require('../../core/logger').Logger)(),
						);
					},
				},
			],
		};
	}
}

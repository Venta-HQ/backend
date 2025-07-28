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
						const appId = configService.get('ALGOLIA_APPLICATION_ID');
						const apiKey = configService.get('ALGOLIA_API_KEY');

						return new AlgoliaService(appId, apiKey);
					},
				},
			],
		};
	}
}

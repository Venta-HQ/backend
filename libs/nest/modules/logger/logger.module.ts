import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestContextModule } from '../request-context';
import { Logger } from './logger.service';
import { LokiTransportService } from './loki-transport.service';

@Module({})
export class LoggerModule {
	static register(): DynamicModule {
		return {
			exports: [Logger],
			global: true,
			imports: [ConfigModule, RequestContextModule],
			module: LoggerModule,
			providers: [
				Logger,
				LokiTransportService,
				{
					inject: [ConfigService],
					provide: 'LOGGER_OPTIONS',
					useFactory: (configService: ConfigService) => ({
						appName: configService.get('APP_NAME') || 'unknown-service',
					}),
				},
				ConfigService, // Make ConfigService available to Logger services
			],
		};
	}
}

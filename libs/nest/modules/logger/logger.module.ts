import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestContextModule } from '../request-context';
import { Logger } from './logger.service';
import { LokiTransportService } from './loki-transport.service';

export interface LoggerOptions {
	appName: string;
}

@Module({})
export class LoggerModule {
	static register(options: LoggerOptions | string): DynamicModule {
		const appName = typeof options === 'string' ? options : options.appName;

		return {
			exports: [Logger],
			global: true,
			imports: [ConfigModule, RequestContextModule],
			module: LoggerModule,
			providers: [
				Logger,
				LokiTransportService,
				{
					provide: 'LOGGER_OPTIONS',
					useValue: { appName },
				},
			],
		};
	}
}

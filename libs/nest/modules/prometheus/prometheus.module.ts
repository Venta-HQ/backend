import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './metrics.interceptor';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';

export interface PrometheusOptions {
	appName: string;
}

@Module({})
export class PrometheusModule {
	static register(options: PrometheusOptions): DynamicModule {
		return {
			controllers: [PrometheusController],
			exports: [PrometheusService],
			imports: [ConfigModule],
			module: PrometheusModule,
			providers: [
				PrometheusService,
				{
					provide: APP_INTERCEPTOR,
					useClass: MetricsInterceptor,
				},
				{
					provide: 'PROMETHEUS_OPTIONS',
					useValue: options,
				},
			],
		};
	}
}

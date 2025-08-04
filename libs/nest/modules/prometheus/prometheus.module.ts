import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';
import { MetricsInterceptor } from './metrics.interceptor';

export interface PrometheusOptions {
	appName: string;
}

@Module({})
export class PrometheusModule {
	static register(options: PrometheusOptions): DynamicModule {
		return {
			module: PrometheusModule,
			controllers: [PrometheusController],
			exports: [PrometheusService],
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

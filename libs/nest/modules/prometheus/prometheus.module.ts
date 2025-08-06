import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './metrics.interceptor';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';

@Module({})
export class PrometheusModule {
	static register(): DynamicModule {
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
					useFactory: (configService: ConfigService) => ({
						appName: configService.get('APP_NAME') || 'unknown-service',
					}),
					inject: [ConfigService],
				},
				ConfigService, // Make ConfigService available to Prometheus services
			],
		};
	}
}

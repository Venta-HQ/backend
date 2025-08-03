import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CircuitBreakerService } from './circuit-breaker.service';
import { HealthController } from './health.controller';
import { MetricsService } from './metrics.service';

@Module({
	imports: [
		TerminusModule,
		PrometheusModule.register({
			path: '/metrics',
			defaultMetrics: {
				enabled: true,
			},
		}),
	],
	controllers: [HealthController],
	providers: [CircuitBreakerService, MetricsService],
	exports: [CircuitBreakerService, MetricsService],
})
export class UtilsModule {}

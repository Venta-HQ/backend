import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@venta/nest/modules';
import { MetricsFactoryRegistry } from '../../modules/monitoring/prometheus/factories/metrics-factory-registry';
import { RequestMetrics } from '../../modules/monitoring/prometheus/interfaces/request-metrics.interface';
import { PrometheusService } from '../../modules/monitoring/prometheus/prometheus.service';

interface Metrics {
	requestDuration: any;
	requestSize: any;
	requestTotal: any;
	responseSize: any;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	private metrics: Metrics | null = null;
	private metricsInitialized = false;

	constructor(
		private readonly prometheusService: PrometheusService,
		private readonly configService: ConfigService,
		@Inject('PROMETHEUS_OPTIONS') private readonly options: { appName: string },
		private readonly logger: Logger,
	) {
		this.logger.setContext(MetricsInterceptor.name);
	}

	private initializeMetrics() {
		if (this.metricsInitialized) return;

		this.logger.debug(`Initializing metrics for service: ${this.options.appName}`);

		// Register protocol-agnostic metrics
		const registeredMetrics = this.prometheusService.registerMetrics([
			{
				buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
				help: 'Request duration in seconds',
				labelNames: ['method', 'route', 'status_code', 'protocol'],
				name: 'request_duration_seconds',
				type: 'histogram',
			},
			{
				help: 'Total number of requests',
				labelNames: ['method', 'route', 'status_code', 'protocol'],
				name: 'requests_total',
				type: 'counter',
			},
			{
				buckets: [100, 1000, 10000, 100000, 1000000],
				help: 'Request size in bytes',
				labelNames: ['method', 'route', 'protocol'],
				name: 'request_size_bytes',
				type: 'histogram',
			},
			{
				buckets: [100, 1000, 10000, 100000, 1000000],
				help: 'Response size in bytes',
				labelNames: ['method', 'route', 'protocol'],
				name: 'response_size_bytes',
				type: 'histogram',
			},
		]);

		this.metrics = {
			requestDuration: registeredMetrics.request_duration_seconds,
			requestSize: registeredMetrics.request_size_bytes,
			requestTotal: registeredMetrics.requests_total,
			responseSize: registeredMetrics.response_size_bytes,
		};

		this.metricsInitialized = true;
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		this.initializeMetrics();

		const startTime = Date.now();

		return next.handle().pipe(
			tap({
				error: (error) => {
					const endTime = Date.now();
					this.recordRequest(context, startTime, endTime, undefined, error);
				},
				next: (data) => {
					const endTime = Date.now();
					this.recordRequest(context, startTime, endTime, data);
				},
			}),
		);
	}

	private recordRequest(context: ExecutionContext, startTime: number, endTime: number, data?: any, error?: any) {
		try {
			// Use the factory registry to get the appropriate metrics factory
			const factory = MetricsFactoryRegistry.getFactory(context);
			const metrics: RequestMetrics = factory.createMetrics(context, startTime, endTime, data);

			// Handle error status codes
			const statusCode = error ? error.status || error.code || 500 : metrics.getStatusCode();

			// Record metrics using protocol-agnostic interface
			const labels = {
				method: metrics.getMethod(),
				protocol: metrics.getProtocol(),
				route: metrics.getRoute(),
				status_code: statusCode.toString(),
			};

			const duration = metrics.getDuration() / 1000; // Convert to seconds

			this.metrics.requestDuration.observe(labels, duration);
			this.metrics.requestTotal.inc(labels);

			// Record request size if available
			const requestSize = metrics.getRequestSize();
			if (requestSize > 0) {
				this.metrics.requestSize.observe(
					{ method: labels.method, protocol: labels.protocol, route: labels.route },
					requestSize,
				);
			}

			// Record response size if available
			const responseSize = metrics.getResponseSize();
			if (responseSize > 0) {
				this.metrics.responseSize.observe(
					{ method: labels.method, protocol: labels.protocol, route: labels.route },
					responseSize,
				);
			}
		} catch (e) {
			// Log but don't throw - metrics collection should not break the application
			this.logger.warn('Failed to record metrics', e);
		}
	}
}

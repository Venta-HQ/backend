import { CallHandler, ExecutionContext, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PrometheusService } from './prometheus.service';

export interface PrometheusOptions {
	appName?: string;
}

export interface RequestMetrics {
	request_duration_seconds: any;
	request_failures_total: any;
	requests_in_progress: any;
	requests_total: any;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	private readonly logger = new Logger(MetricsInterceptor.name);
	private metrics: RequestMetrics | null = null;
	private metricsInitialized = false;

	constructor(
		private readonly prometheusService: PrometheusService,
		@Optional() @Inject('PROMETHEUS_OPTIONS') private readonly options?: PrometheusOptions,
		@Optional() private readonly configService?: ConfigService,
	) {}

	private getServiceName(): string {
		// Use the app name from options if provided
		if (this.options?.appName) {
			return this.options.appName;
		}

		// Try to get app name from config service as fallback
		const appName = this.configService?.get('APP_NAME');
		if (appName) {
			return appName;
		}

		// Fallback to a default name
		return 'unknown-app';
	}

	private initializeMetrics(): void {
		if (this.metricsInitialized) {
			return;
		}

		try {
			// Check if metrics are already registered to avoid duplicates
			if (this.prometheusService.hasMetric('requests_total')) {
				this.metrics = {
					request_duration_seconds: this.prometheusService.getMetric('request_duration_seconds'),
					request_failures_total: this.prometheusService.getMetric('request_failures_total'),
					requests_in_progress: this.prometheusService.getMetric('requests_in_progress'),
					requests_total: this.prometheusService.getMetric('requests_total'),
				};
			} else {
				// Register metrics for this interceptor
				const registeredMetrics = this.prometheusService.registerMetrics([
					{
						help: 'Total number of requests',
						labelNames: ['service', 'protocol', 'method', 'path', 'status_code'],
						name: 'requests_total',
						type: 'counter',
					},
					{
						buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
						help: 'Duration of requests',
						labelNames: ['service', 'protocol', 'method', 'path'],
						name: 'request_duration_seconds',
						type: 'histogram',
					},
					{
						help: 'Number of requests currently in progress',
						labelNames: ['service', 'protocol', 'method'],
						name: 'requests_in_progress',
						type: 'gauge',
					},
					{
						help: 'Total number of request failures',
						labelNames: ['service', 'protocol', 'method', 'path', 'error_type'],
						name: 'request_failures_total',
						type: 'counter',
					},
				]);

				this.metrics = {
					request_duration_seconds: registeredMetrics.request_duration_seconds,
					request_failures_total: registeredMetrics.request_failures_total,
					requests_in_progress: registeredMetrics.requests_in_progress,
					requests_total: registeredMetrics.requests_total,
				};
			}

			this.metricsInitialized = true;
		} catch (error) {
			this.logger.warn('Failed to initialize metrics interceptor', error);
			this.metrics = null;
		}
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		// Initialize metrics lazily
		this.initializeMetrics();

		// If metrics failed to initialize, just pass through
		if (!this.metrics) {
			return next.handle();
		}

		const requestInfo = this.extractRequestInfo(context);
		const startTime = Date.now();

		try {
			// Increment in-progress requests
			this.metrics.requests_in_progress.inc({
				method: requestInfo.method,
				protocol: requestInfo.protocol,
				service: this.getServiceName(),
			});
		} catch (error) {
			this.logger.warn('Failed to increment in-progress requests', error);
		}

		return next.handle().pipe(
			tap(() => {
				// Record successful request
				this.recordRequest(requestInfo, startTime, 'success');
			}),
			catchError((error) => {
				// Record failed request
				this.recordRequest(requestInfo, startTime, 'failure', error);
				throw error;
			}),
		);
	}

	private extractRequestInfo(context: ExecutionContext): {
		method: string;
		path: string;
		protocol: string;
	} {
		const contextType = context.getType();

		switch (contextType) {
			case 'http':
				const httpContext = context.switchToHttp();
				const request = httpContext.getRequest();
				return {
					method: request.method,
					path: this.normalizePath(request.url),
					protocol: 'http',
				};

			case 'rpc':
				// For gRPC, we can extract method info from the context
				const methodName = context.getHandler()?.name || 'unknown';
				const className = context.getClass()?.name || 'UnknownService';
				return {
					method: methodName,
					path: `${className}.${methodName}`,
					protocol: 'grpc',
				};

			case 'ws':
				const wsContext = context.switchToWs();
				const wsData = wsContext.getData();
				return {
					method: wsData?.event || 'message',
					path: 'websocket',
					protocol: 'websocket',
				};

			default:
				return {
					method: 'unknown',
					path: 'unknown',
					protocol: 'unknown',
				};
		}
	}

	private normalizePath(path: string): string {
		// Remove query parameters
		const cleanPath = path.split('?')[0];

		// Normalize common patterns
		if (cleanPath.includes('/api/')) {
			// Extract the API path after /api/
			const apiPath = cleanPath.split('/api/')[1];
			return `/api/${apiPath}`;
		}

		return cleanPath;
	}

	private recordRequest(
		requestInfo: { method: string; path: string; protocol: string },
		startTime: number,
		status: 'success' | 'failure',
		error?: any,
	): void {
		if (!this.metrics) {
			return;
		}

		const durationSeconds = (Date.now() - startTime) / 1000;
		const statusCode = status === 'success' ? '200' : '500';
		const serviceName = this.getServiceName();

		try {
			// Record request count
			this.metrics.requests_total.inc({
				method: requestInfo.method,
				path: requestInfo.path,
				protocol: requestInfo.protocol,
				service: serviceName,
				status_code: statusCode,
			});

			// Record request duration
			this.metrics.request_duration_seconds.observe(
				{
					method: requestInfo.method,
					path: requestInfo.path,
					protocol: requestInfo.protocol,
					service: serviceName,
				},
				durationSeconds,
			);

			// Record failures if applicable
			if (status === 'failure') {
				const errorType = error?.constructor?.name || 'UnknownError';
				this.metrics.request_failures_total.inc({
					error_type: errorType,
					method: requestInfo.method,
					path: requestInfo.path,
					protocol: requestInfo.protocol,
					service: serviceName,
				});
			}
		} catch (metricsError) {
			this.logger.warn('Failed to record request metrics', metricsError);
		}

		try {
			// Decrement in-progress requests
			this.metrics.requests_in_progress.dec({
				method: requestInfo.method,
				protocol: requestInfo.protocol,
				service: serviceName,
			});
		} catch (decrementError) {
			this.logger.warn('Failed to decrement in-progress requests', decrementError);
		}
	}
}

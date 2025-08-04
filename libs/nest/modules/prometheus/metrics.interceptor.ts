import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger, Inject, Optional } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { PrometheusOptions } from './prometheus.module';

export interface RequestMetrics {
	requests_total: any;
	request_duration_seconds: any;
	requests_in_progress: any;
	request_failures_total: any;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	private readonly logger = new Logger(MetricsInterceptor.name);
	private metrics: RequestMetrics | null = null;
	private metricsInitialized = false;

	constructor(
		private readonly prometheusService: PrometheusService,
		@Optional() @Inject('PROMETHEUS_OPTIONS') private readonly options?: PrometheusOptions,
	) {}

	private getServiceName(): string {
		// Use the app name from options if provided
		if (this.options?.appName) {
			return this.options.appName;
		}

		// Try to get app name from environment variables as fallback
		const appName = process.env.APP_NAME;
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
					requests_total: this.prometheusService.getMetric('requests_total'),
					request_duration_seconds: this.prometheusService.getMetric('request_duration_seconds'),
					requests_in_progress: this.prometheusService.getMetric('requests_in_progress'),
					request_failures_total: this.prometheusService.getMetric('request_failures_total'),
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
					requests_total: registeredMetrics.requests_total,
					request_duration_seconds: registeredMetrics.request_duration_seconds,
					requests_in_progress: registeredMetrics.requests_in_progress,
					request_failures_total: registeredMetrics.request_failures_total,
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
				service: this.getServiceName(),
				protocol: requestInfo.protocol,
				method: requestInfo.method,
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
		protocol: string;
		method: string;
		path: string;
	} {
		const contextType = context.getType();

		switch (contextType) {
			case 'http':
				const httpContext = context.switchToHttp();
				const request = httpContext.getRequest();
				return {
					protocol: 'http',
					method: request.method,
					path: this.normalizePath(request.url),
				};

			case 'rpc':
				const rpcContext = context.switchToRpc();
				const rpcData = rpcContext.getData();
				// For gRPC, we can extract method info from the context
				const methodName = context.getHandler()?.name || 'unknown';
				const className = context.getClass()?.name || 'UnknownService';
				return {
					protocol: 'grpc',
					method: methodName,
					path: `${className}.${methodName}`,
				};

			case 'ws':
				const wsContext = context.switchToWs();
				const client = wsContext.getClient();
				const wsData = wsContext.getData();
				return {
					protocol: 'websocket',
					method: wsData?.event || 'message',
					path: 'websocket',
				};

			default:
				return {
					protocol: 'unknown',
					method: 'unknown',
					path: 'unknown',
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
		requestInfo: { protocol: string; method: string; path: string },
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
				service: serviceName,
				protocol: requestInfo.protocol,
				method: requestInfo.method,
				path: requestInfo.path,
				status_code: statusCode,
			});

			// Record request duration
			this.metrics.request_duration_seconds.observe(
				{
					service: serviceName,
					protocol: requestInfo.protocol,
					method: requestInfo.method,
					path: requestInfo.path,
				},
				durationSeconds,
			);

			// Record failures if applicable
			if (status === 'failure') {
				const errorType = error?.constructor?.name || 'UnknownError';
				this.metrics.request_failures_total.inc({
					service: serviceName,
					protocol: requestInfo.protocol,
					method: requestInfo.method,
					path: requestInfo.path,
					error_type: errorType,
				});
			}
		} catch (error) {
			this.logger.warn('Failed to record request metrics', error);
		}

		try {
			// Decrement in-progress requests
			this.metrics.requests_in_progress.dec({
				service: serviceName,
				protocol: requestInfo.protocol,
				method: requestInfo.method,
			});
		} catch (error) {
			this.logger.warn('Failed to decrement in-progress requests', error);
		}
	}
} 
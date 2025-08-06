import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrometheusService } from './prometheus.service';

interface RequestMetrics {
	requestDuration: any;
	requestSize: any;
	requestTotal: any;
	responseSize: any;
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	private readonly logger = new Logger(MetricsInterceptor.name);
	private metrics: RequestMetrics | null = null;
	private metricsInitialized = false;

	constructor(
		private readonly prometheusService: PrometheusService,
		private readonly configService: ConfigService,
		@Inject('PROMETHEUS_OPTIONS') private readonly options: { appName: string },
	) {}

	private getServiceName(): string {
		return this.options?.appName || this.configService.get('APP_NAME') || 'unknown-app';
	}

	private initializeMetrics() {
		if (this.metricsInitialized) return;

		const serviceName = this.getServiceName();
		this.logger.log(`Initializing metrics for service: ${serviceName}`);

		// Register metrics using the PrometheusService
		const registeredMetrics = this.prometheusService.registerMetrics([
			{
				buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
				help: 'Request duration in seconds',
				labelNames: ['method', 'route', 'status_code'],
				name: 'http_request_duration_seconds',
				type: 'histogram',
			},
			{
				help: 'Total number of HTTP requests',
				labelNames: ['method', 'route', 'status_code'],
				name: 'http_requests_total',
				type: 'counter',
			},
			{
				buckets: [100, 1000, 10000, 100000, 1000000],
				help: 'Request size in bytes',
				labelNames: ['method', 'route'],
				name: 'http_request_size_bytes',
				type: 'histogram',
			},
			{
				buckets: [100, 1000, 10000, 100000, 1000000],
				help: 'Response size in bytes',
				labelNames: ['method', 'route'],
				name: 'http_response_size_bytes',
				type: 'histogram',
			},
		]);

		this.metrics = {
			requestDuration: registeredMetrics.http_request_duration_seconds,
			requestSize: registeredMetrics.http_request_size_bytes,
			requestTotal: registeredMetrics.http_requests_total,
			responseSize: registeredMetrics.http_response_size_bytes,
		};

		this.metricsInitialized = true;
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		this.initializeMetrics();

		// Check if this is an HTTP or gRPC request
		const contextType = context.getType();

		if (contextType === 'http') {
			return this.interceptHttp(context, next);
		} else if (contextType === 'rpc') {
			return this.interceptGrpc(context, next);
		}

		// For other context types, just pass through
		return next.handle();
	}

	private interceptHttp(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		const startTime = Date.now();

		const method = request.method;
		const route = request.route?.path || 'unknown';
		const requestSize = request.headers['content-length'] ? parseInt(request.headers['content-length'], 10) : 0;

		// Record request size
		if (requestSize > 0) {
			this.metrics!.requestSize.observe({ method, route }, requestSize);
		}

		return next.handle().pipe(
			tap({
				error: (error) => {
					const statusCode = error.status || 500;
					this.recordRequest(method, route, statusCode, startTime);
				},
				next: (data) => {
					this.recordRequest(method, route, response.statusCode, startTime, data);
				},
			}),
		);
	}

	private interceptGrpc(context: ExecutionContext, next: CallHandler): Observable<any> {
		const startTime = Date.now();

		// For gRPC, we can get the handler name and method
		const handler = context.getHandler();
		const method = handler.name || 'unknown';
		const route = 'grpc'; // gRPC doesn't have routes like HTTP

		// gRPC doesn't have content-length headers, so we'll skip request size
		// We could potentially calculate this from the actual data if needed

		return next.handle().pipe(
			tap({
				error: (error) => {
					const statusCode = error.code || 500;
					this.recordRequest(method, route, statusCode, startTime);
				},
				next: (data) => {
					// gRPC typically returns 200 (OK) for successful responses
					this.recordRequest(method, route, 200, startTime, data);
				},
			}),
		);
	}

	private recordRequest(method: string, route: string, statusCode: number, startTime: number, data?: any) {
		const duration = (Date.now() - startTime) / 1000;
		const responseSize = data ? JSON.stringify(data).length : 0;

		this.metrics!.requestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
		this.metrics!.requestTotal.inc({ method, route, status_code: statusCode.toString() });

		if (responseSize > 0) {
			this.metrics!.responseSize.observe({ method, route }, responseSize);
		}
	}
}

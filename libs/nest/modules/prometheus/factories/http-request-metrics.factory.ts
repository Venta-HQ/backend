import { ExecutionContext } from '@nestjs/common';
import { RequestMetrics, RequestMetricsFactory } from '../interfaces/request-metrics.interface';

/**
 * HTTP-specific implementation of RequestMetrics
 */
class HttpRequestMetrics implements RequestMetrics {
	constructor(
		private readonly method: string,
		private readonly route: string,
		private readonly requestSize: number,
		private readonly responseSize: number,
		private readonly duration: number,
		private readonly statusCode: number,
	) {}

	getMethod(): string {
		return this.method;
	}

	getRoute(): string {
		return this.route;
	}

	getRequestSize(): number {
		return this.requestSize;
	}

	getResponseSize(): number {
		return this.responseSize;
	}

	getDuration(): number {
		return this.duration;
	}

	getStatusCode(): number {
		return this.statusCode;
	}

	getProtocol(): string {
		return 'http';
	}
}

/**
 * HTTP-specific factory for creating request metrics
 */
export class HttpRequestMetricsFactory implements RequestMetricsFactory {
	createMetrics(context: ExecutionContext, startTime: number, endTime: number, data?: any): RequestMetrics {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		const method = request.method;
		const route = request.route?.path || 'unknown';
		const requestSize = request.headers['content-length'] ? parseInt(request.headers['content-length'], 10) : 0;
		const responseSize = data ? JSON.stringify(data).length : 0;
		const duration = endTime - startTime;
		const statusCode = response.statusCode;

		return new HttpRequestMetrics(method, route, requestSize, responseSize, duration, statusCode);
	}
} 
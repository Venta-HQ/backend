import { ExecutionContext } from '@nestjs/common';
import { RequestMetrics, RequestMetricsFactory } from '../interfaces/request-metrics.interface';

/**
 * gRPC-specific implementation of RequestMetrics
 */
class GrpcRequestMetrics implements RequestMetrics {
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
		return 'grpc';
	}
}

/**
 * gRPC-specific factory for creating request metrics
 */
export class GrpcRequestMetricsFactory implements RequestMetricsFactory {
	createMetrics(context: ExecutionContext, startTime: number, endTime: number, data?: any): RequestMetrics {
		const handler = context.getHandler();
		const method = handler?.name || 'unknown';
		const route = 'grpc'; // gRPC doesn't have routes like HTTP
		const requestSize = 0; // gRPC doesn't provide content-length headers
		const responseSize = data ? JSON.stringify(data).length : 0;
		const duration = endTime - startTime;
		const statusCode = 200; // gRPC typically returns 200 for successful responses

		return new GrpcRequestMetrics(method, route, requestSize, responseSize, duration, statusCode);
	}
}

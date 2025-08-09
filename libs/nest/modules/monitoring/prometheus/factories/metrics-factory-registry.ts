import { ExecutionContext } from '@nestjs/common';
import { RequestMetricsFactory } from '../interfaces/request-metrics.interface';
import { GrpcRequestMetricsFactory } from './grpc-request-metrics.factory';
import { HttpRequestMetricsFactory } from './http-request-metrics.factory';

/**
 * Registry for protocol-specific metrics factories
 */
export class MetricsFactoryRegistry {
	private static readonly factories = new Map<string, RequestMetricsFactory>([
		['http', new HttpRequestMetricsFactory()],
		['rpc', new GrpcRequestMetricsFactory()],
	]);

	/**
	 * Get the appropriate metrics factory for the given context
	 */
	static getFactory(context: ExecutionContext): RequestMetricsFactory {
		const contextType = context.getType();
		const factory = this.factories.get(contextType);

		if (!factory) {
			// Fallback to HTTP factory for unknown context types
			return this.factories.get('http');
		}

		return factory;
	}

	/**
	 * Check if the registry supports the given context type
	 */
	static supports(contextType: string): boolean {
		return this.factories.has(contextType);
	}
}

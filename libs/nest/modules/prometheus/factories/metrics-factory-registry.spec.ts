import { ExecutionContext } from '@nestjs/common';
import { vi } from 'vitest';
import { MetricsFactoryRegistry } from './metrics-factory-registry';
import { HttpRequestMetricsFactory } from './http-request-metrics.factory';
import { GrpcRequestMetricsFactory } from './grpc-request-metrics.factory';

describe('MetricsFactoryRegistry', () => {
	describe('getFactory', () => {
		it('should return HttpRequestMetricsFactory for HTTP context', () => {
			const mockContext = {
				getType: vi.fn().mockReturnValue('http'),
			} as unknown as ExecutionContext;

			const factory = MetricsFactoryRegistry.getFactory(mockContext);

			expect(factory).toBeInstanceOf(HttpRequestMetricsFactory);
		});

		it('should return GrpcRequestMetricsFactory for gRPC context', () => {
			const mockContext = {
				getType: vi.fn().mockReturnValue('rpc'),
			} as unknown as ExecutionContext;

			const factory = MetricsFactoryRegistry.getFactory(mockContext);

			expect(factory).toBeInstanceOf(GrpcRequestMetricsFactory);
		});

		it('should fallback to HttpRequestMetricsFactory for unknown context type', () => {
			const mockContext = {
				getType: vi.fn().mockReturnValue('unknown'),
			} as unknown as ExecutionContext;

			const factory = MetricsFactoryRegistry.getFactory(mockContext);

			expect(factory).toBeInstanceOf(HttpRequestMetricsFactory);
		});
	});

	describe('supports', () => {
		it('should return true for supported context types', () => {
			expect(MetricsFactoryRegistry.supports('http')).toBe(true);
			expect(MetricsFactoryRegistry.supports('rpc')).toBe(true);
		});

		it('should return false for unsupported context types', () => {
			expect(MetricsFactoryRegistry.supports('unknown')).toBe(false);
			expect(MetricsFactoryRegistry.supports('websocket')).toBe(false);
		});
	});
}); 
import { vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { GrpcRequestMetricsFactory } from './grpc-request-metrics.factory';

describe('GrpcRequestMetricsFactory', () => {
	let factory: GrpcRequestMetricsFactory;
	let mockContext: ExecutionContext;

	beforeEach(() => {
		factory = new GrpcRequestMetricsFactory();
	});

	describe('createMetrics', () => {
		it('should create metrics with correct gRPC properties', () => {
			const mockHandler = {
				name: 'getUserById',
			};

			mockContext = {
				getHandler: vi.fn().mockReturnValue(mockHandler),
			} as unknown as ExecutionContext;

			const startTime = 1000;
			const endTime = 1075;
			const data = { id: 1, name: 'John' };

			const metrics = factory.createMetrics(mockContext, startTime, endTime, data);

			expect(metrics.getMethod()).toBe('getUserById');
			expect(metrics.getRoute()).toBe('grpc');
			expect(metrics.getRequestSize()).toBe(0);
			expect(metrics.getResponseSize()).toBe(JSON.stringify(data).length);
			expect(metrics.getDuration()).toBe(75);
			expect(metrics.getStatusCode()).toBe(200);
			expect(metrics.getProtocol()).toBe('grpc');
		});

		it('should handle missing handler name', () => {
			const mockHandler = {};

			mockContext = {
				getHandler: vi.fn().mockReturnValue(mockHandler),
			} as unknown as ExecutionContext;

			const startTime = 1000;
			const endTime = 1100;

			const metrics = factory.createMetrics(mockContext, startTime, endTime);

			expect(metrics.getMethod()).toBe('unknown');
		});

		it('should handle null handler', () => {
			mockContext = {
				getHandler: vi.fn().mockReturnValue(null),
			} as unknown as ExecutionContext;

			const startTime = 1000;
			const endTime = 1100;

			const metrics = factory.createMetrics(mockContext, startTime, endTime);

			expect(metrics.getMethod()).toBe('unknown');
		});

		it('should handle empty response data', () => {
			const mockHandler = {
				name: 'getUserById',
			};

			mockContext = {
				getHandler: vi.fn().mockReturnValue(mockHandler),
			} as unknown as ExecutionContext;

			const startTime = 1000;
			const endTime = 1100;

			const metrics = factory.createMetrics(mockContext, startTime, endTime);

			expect(metrics.getResponseSize()).toBe(0);
		});
	});
});

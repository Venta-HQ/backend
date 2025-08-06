import { vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { HttpRequestMetricsFactory } from './http-request-metrics.factory';

describe('HttpRequestMetricsFactory', () => {
	let factory: HttpRequestMetricsFactory;
	let mockContext: ExecutionContext;

	beforeEach(() => {
		factory = new HttpRequestMetricsFactory();
	});

	describe('createMetrics', () => {
		it('should create metrics with correct HTTP properties', () => {
			const mockRequest = {
				headers: { 'content-length': '1024' },
				method: 'POST',
				route: { path: '/api/users' },
			};

			const mockResponse = {
				statusCode: 201,
			};

			mockContext = {
				switchToHttp: vi.fn().mockReturnValue({
					getRequest: vi.fn().mockReturnValue(mockRequest),
					getResponse: vi.fn().mockReturnValue(mockResponse),
				}),
			} as unknown as ExecutionContext;

			const startTime = 1000;
			const endTime = 1150;
			const data = { id: 1, name: 'John' };

			const metrics = factory.createMetrics(mockContext, startTime, endTime, data);

			expect(metrics.getMethod()).toBe('POST');
			expect(metrics.getRoute()).toBe('/api/users');
			expect(metrics.getRequestSize()).toBe(1024);
			expect(metrics.getResponseSize()).toBe(JSON.stringify(data).length);
			expect(metrics.getDuration()).toBe(150);
			expect(metrics.getStatusCode()).toBe(201);
			expect(metrics.getProtocol()).toBe('http');
		});

		it('should handle missing content-length header', () => {
			const mockRequest = {
				headers: {},
				method: 'GET',
				route: { path: '/api/users' },
			};

			const mockResponse = {
				statusCode: 200,
			};

			mockContext = {
				switchToHttp: vi.fn().mockReturnValue({
					getRequest: vi.fn().mockReturnValue(mockRequest),
					getResponse: vi.fn().mockReturnValue(mockResponse),
				}),
			} as unknown as ExecutionContext;

			const startTime = 1000;
			const endTime = 1100;

			const metrics = factory.createMetrics(mockContext, startTime, endTime);

			expect(metrics.getRequestSize()).toBe(0);
			expect(metrics.getResponseSize()).toBe(0);
		});

		it('should handle missing route path', () => {
			const mockRequest = {
				headers: {},
				method: 'GET',
				route: {},
			};

			const mockResponse = {
				statusCode: 200,
			};

			mockContext = {
				switchToHttp: vi.fn().mockReturnValue({
					getRequest: vi.fn().mockReturnValue(mockRequest),
					getResponse: vi.fn().mockReturnValue(mockResponse),
				}),
			} as unknown as ExecutionContext;

			const startTime = 1000;
			const endTime = 1100;

			const metrics = factory.createMetrics(mockContext, startTime, endTime);

			expect(metrics.getRoute()).toBe('unknown');
		});
	});
});

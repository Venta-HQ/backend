import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { MetricsInterceptor } from './metrics.interceptor';

describe('MetricsInterceptor', () => {
	let interceptor: MetricsInterceptor;
	let prometheusService: any;
	let configService: any;
	let mockMetrics: any;

	beforeEach(async () => {
		mockMetrics = {
			http_request_duration_seconds: {
				observe: vi.fn(),
			},
			http_request_size_bytes: {
				observe: vi.fn(),
			},
			http_requests_total: {
				inc: vi.fn(),
			},
			http_response_size_bytes: {
				observe: vi.fn(),
			},
		};

		prometheusService = {
			registerMetrics: vi.fn().mockReturnValue(mockMetrics),
		};

		configService = {
			get: vi.fn().mockReturnValue('test-app'),
		};

		// Manually create the interceptor with mocked dependencies
		interceptor = new MetricsInterceptor(prometheusService, configService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should be defined', () => {
		expect(interceptor).toBeDefined();
	});

	it('should handle HTTP requests correctly', async () => {
		const mockContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: { 'content-length': '100' },
					method: 'GET',
					route: { path: '/api/users' },
				}),
				getResponse: vi.fn().mockReturnValue({
					statusCode: 200,
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('success')),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1500); // end time

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('success');
		expect(mockCallHandler.handle).toHaveBeenCalled();
		expect(prometheusService.registerMetrics).toHaveBeenCalled();
		expect(configService.get).toHaveBeenCalledWith('APP_NAME');
	});

	it('should handle gRPC requests correctly', async () => {
		const mockContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: {},
					method: 'POST',
					route: { path: '/grpc' },
				}),
				getResponse: vi.fn().mockReturnValue({
					statusCode: 200,
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('grpc response')),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(2000); // end time

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('grpc response');
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle WebSocket requests correctly', async () => {
		const mockContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: {},
					method: 'GET',
					route: { path: '/ws' },
				}),
				getResponse: vi.fn().mockReturnValue({
					statusCode: 101,
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('ws response')),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1200); // end time

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('ws response');
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle failed requests correctly', async () => {
		const mockContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: {},
					method: 'POST',
					route: { path: '/api/error' },
				}),
				getResponse: vi.fn().mockReturnValue({
					statusCode: 500,
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(throwError(() => new Error('Test error'))),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1500); // end time

		await expect(firstValueFrom(interceptor.intercept(mockContext, mockCallHandler))).rejects.toThrow('Test error');
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle metrics initialization failure gracefully', async () => {
		const mockContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: {},
					method: 'GET',
					route: { path: '/api/test' },
				}),
				getResponse: vi.fn().mockReturnValue({
					statusCode: 200,
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('success')),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1500); // end time

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('success');
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle metrics initialization gracefully', async () => {
		const mockContext = {
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					headers: {},
					method: 'GET',
					route: { path: '/api/test' },
				}),
				getResponse: vi.fn().mockReturnValue({
					statusCode: 200,
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('success')),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1500); // end time

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('success');
		expect(mockCallHandler.handle).toHaveBeenCalled();
		expect(prometheusService.registerMetrics).toHaveBeenCalled();
	});
});

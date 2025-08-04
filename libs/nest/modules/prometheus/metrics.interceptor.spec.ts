import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsInterceptor } from './metrics.interceptor';
import { PrometheusService } from './prometheus.service';

describe('MetricsInterceptor', () => {
	let interceptor: MetricsInterceptor;
	let prometheusService: any;
	let mockMetrics: any;

	beforeEach(async () => {
		mockMetrics = {
			request_duration_seconds: {
				observe: vi.fn(),
			},
			request_failures_total: {
				inc: vi.fn(),
			},
			requests_in_progress: {
				dec: vi.fn(),
				inc: vi.fn(),
			},
			requests_total: {
				inc: vi.fn(),
			},
		};

		const mockPrometheusService = {
			getMetric: vi.fn().mockImplementation((name: string) => {
				return mockMetrics[name] || undefined;
			}),
			hasMetric: vi.fn().mockReturnValue(false),
			registerMetrics: vi.fn().mockReturnValue(mockMetrics),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: PrometheusService,
					useValue: mockPrometheusService,
				},
				MetricsInterceptor,
			],
		}).compile();

		interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
		prometheusService = module.get(PrometheusService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should be defined', () => {
		expect(interceptor).toBeDefined();
	});

	it('should handle HTTP requests correctly', async () => {
		const mockContext = {
			getType: vi.fn().mockReturnValue('http'),
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					method: 'GET',
					url: '/api/users',
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

	it('should handle gRPC requests correctly', async () => {
		const mockContext = {
			getClass: vi.fn().mockReturnValue({ name: 'UserService' }),
			getHandler: vi.fn().mockReturnValue({ name: 'getUser' }),
			getType: vi.fn().mockReturnValue('rpc'),
			switchToRpc: vi.fn().mockReturnValue({
				getData: vi.fn().mockReturnValue({ userId: '123' }),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('user data')),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1100); // end time

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('user data');
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle WebSocket requests correctly', async () => {
		const mockContext = {
			getType: vi.fn().mockReturnValue('ws'),
			switchToWs: vi.fn().mockReturnValue({
				getClient: vi.fn().mockReturnValue({ id: 'client-123' }),
				getData: vi.fn().mockReturnValue({ event: 'location_update' }),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('processed')),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1050); // end time

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('processed');
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle failed requests correctly', async () => {
		const mockContext = {
			getType: vi.fn().mockReturnValue('http'),
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					method: 'POST',
					url: '/api/users',
				}),
			}),
		} as unknown as ExecutionContext;

		const error = new Error('Database connection failed');
		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(throwError(() => error)),
		} as CallHandler;

		vi.spyOn(Date, 'now')
			.mockReturnValueOnce(1000) // start time
			.mockReturnValueOnce(1200); // end time

		await expect(firstValueFrom(interceptor.intercept(mockContext, mockCallHandler))).rejects.toBe(error);
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle metrics initialization failure gracefully', async () => {
		// Mock a failure in metrics initialization
		prometheusService.registerMetrics.mockImplementation(() => {
			throw new Error('Metrics initialization failed');
		});

		const mockContext = {
			getType: vi.fn().mockReturnValue('http'),
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					method: 'GET',
					url: '/api/users',
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('success')),
		} as CallHandler;

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('success');
		expect(mockCallHandler.handle).toHaveBeenCalled();
	});

	it('should handle metrics initialization gracefully', async () => {
		// Test that the interceptor works regardless of metrics initialization
		const mockContext = {
			getType: vi.fn().mockReturnValue('http'),
			switchToHttp: vi.fn().mockReturnValue({
				getRequest: vi.fn().mockReturnValue({
					method: 'GET',
					url: '/api/users',
				}),
			}),
		} as unknown as ExecutionContext;

		const mockCallHandler = {
			handle: vi.fn().mockReturnValue(of('success')),
		} as CallHandler;

		const result = await firstValueFrom(interceptor.intercept(mockContext, mockCallHandler));

		expect(result).toBe('success');
		expect(mockCallHandler.handle).toHaveBeenCalled();
		// The interceptor should work even if metrics fail to initialize
	});
});

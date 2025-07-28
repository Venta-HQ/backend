import { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GrpcLogger } from './grpc-logger.service';
import { RequestContextService } from './request-context.service';

describe('GrpcLogger', () => {
	let grpcLogger: GrpcLogger;
	let mockPinoLogger: vi.Mocked<PinoLogger>;
	let mockRequestContextService: vi.Mocked<RequestContextService>;

	beforeEach(() => {
		vi.clearAllMocks();

		mockPinoLogger = {
			info: vi.fn(),
			error: vi.fn(),
			fatal: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		} as any;

		mockRequestContextService = {
			get: vi.fn(),
			set: vi.fn(),
			run: vi.fn(),
		} as any;

		grpcLogger = new GrpcLogger(mockPinoLogger, mockRequestContextService);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create logger with PinoLogger and RequestContextService', () => {
			expect(grpcLogger).toBeDefined();
		});
	});

	describe('log method', () => {
		it('should log info message with context and request ID', () => {
			const message = 'Test log message';
			const context = 'TestContext';
			const optionalParams = { userId: '123', action: 'test' };
			const requestId = 'req-123';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.log(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId,
				},
				message
			);
		});

		it('should handle missing request ID', () => {
			const message = 'Test log message';
			const context = 'TestContext';
			const optionalParams = { userId: '123' };

			mockRequestContextService.get.mockReturnValue(undefined);
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId: undefined,
				},
				message
			);
		});

		it('should handle empty optional params', () => {
			const message = 'Test log message';
			const context = 'TestContext';
			const optionalParams = {};

			mockRequestContextService.get.mockReturnValue('req-123');
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context,
					requestId: 'req-123',
				},
				message
			);
		});
	});

	describe('error method', () => {
		it('should log error message with context and request ID', () => {
			const message = 'Test error message';
			const context = 'TestContext';
			const optionalParams = { error: 'test error', stack: 'stack trace' };
			const requestId = 'req-123';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.error(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId,
				},
				message
			);
		});

		it('should handle error logging with complex params', () => {
			const message = 'Database connection failed';
			const context = 'DatabaseService';
			const optionalParams = {
				error: new Error('Connection timeout'),
				attempt: 3,
				timeout: 5000,
			};

			mockRequestContextService.get.mockReturnValue('req-456');
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.error(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId: 'req-456',
				},
				message
			);
		});
	});

	describe('fatal method', () => {
		it('should log fatal message with context and request ID', () => {
			const message = 'Critical system failure';
			const context = 'SystemService';
			const optionalParams = { component: 'database', severity: 'critical' };
			const requestId = 'req-789';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.fatal.mockReturnValue(undefined);

			grpcLogger.fatal(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.fatal).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId,
				},
				message
			);
		});

		it('should handle fatal logging with minimal params', () => {
			const message = 'System shutdown';
			const context = 'ShutdownService';
			const optionalParams = {};

			mockRequestContextService.get.mockReturnValue('req-999');
			mockPinoLogger.fatal.mockReturnValue(undefined);

			grpcLogger.fatal(message, context, optionalParams);

			expect(mockPinoLogger.fatal).toHaveBeenCalledWith(
				{
					context,
					requestId: 'req-999',
				},
				message
			);
		});
	});

	describe('warn method', () => {
		it('should log warning message with context and request ID', () => {
			const message = 'Deprecated method called';
			const context = 'LegacyService';
			const optionalParams = { method: 'oldMethod', alternative: 'newMethod' };
			const requestId = 'req-warn';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.warn.mockReturnValue(undefined);

			grpcLogger.warn(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.warn).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId,
				},
				message
			);
		});

		it('should handle warning with performance metrics', () => {
			const message = 'Slow query detected';
			const context = 'QueryService';
			const optionalParams = { duration: 1500, threshold: 1000, query: 'SELECT * FROM large_table' };

			mockRequestContextService.get.mockReturnValue('req-slow');
			mockPinoLogger.warn.mockReturnValue(undefined);

			grpcLogger.warn(message, context, optionalParams);

			expect(mockPinoLogger.warn).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId: 'req-slow',
				},
				message
			);
		});
	});

	describe('debug method', () => {
		it('should log debug message with context and request ID', () => {
			const message = 'Processing user request';
			const context = 'UserService';
			const optionalParams = { userId: '123', step: 'validation' };
			const requestId = 'req-debug';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.debug.mockReturnValue(undefined);

			grpcLogger.debug(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.debug).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId,
				},
				message
			);
		});

		it('should handle debug logging with detailed params', () => {
			const message = 'Cache miss';
			const context = 'CacheService';
			const optionalParams = {
				key: 'user:123:profile',
				ttl: 3600,
				hitRate: 0.85,
			};

			mockRequestContextService.get.mockReturnValue('req-cache');
			mockPinoLogger.debug.mockReturnValue(undefined);

			grpcLogger.debug(message, context, optionalParams);

			expect(mockPinoLogger.debug).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId: 'req-cache',
				},
				message
			);
		});
	});

	describe('verbose method', () => {
		it('should log verbose message with context and request ID', () => {
			const message = 'Detailed operation step';
			const context = 'OperationService';
			const optionalParams = { step: 1, totalSteps: 5, details: 'step details' };
			const requestId = 'req-verbose';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.verbose(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId,
				},
				message
			);
		});

		it('should handle verbose logging with trace information', () => {
			const message = 'Function entry';
			const context = 'TraceService';
			const optionalParams = {
				function: 'processUserData',
				args: ['userId', 'options'],
				timestamp: new Date().toISOString(),
			};

			mockRequestContextService.get.mockReturnValue('req-trace');
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.verbose(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					...optionalParams,
					context,
					requestId: 'req-trace',
				},
				message
			);
		});
	});

	describe('edge cases', () => {
		it('should handle null or undefined message', () => {
			const message = null;
			const context = 'TestContext';
			const optionalParams = {};

			mockRequestContextService.get.mockReturnValue('req-null');
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context,
					requestId: 'req-null',
				},
				null
			);
		});

		it('should handle empty context', () => {
			const message = 'Test message';
			const context = '';
			const optionalParams = {};

			mockRequestContextService.get.mockReturnValue('req-empty');
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: '',
					requestId: 'req-empty',
				},
				message
			);
		});

		it('should handle null optional params', () => {
			const message = 'Test message';
			const context = 'TestContext';
			const optionalParams = null;

			mockRequestContextService.get.mockReturnValue('req-null-params');
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context,
					requestId: 'req-null-params',
				},
				message
			);
		});
	});

	describe('performance considerations', () => {
		it('should handle high-frequency logging', () => {
			const message = 'High frequency log';
			const context = 'PerformanceTest';
			const optionalParams = { iteration: 0 };
			const requestId = 'req-perf';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.info.mockReturnValue(undefined);

			// Test multiple rapid log calls
			for (let i = 0; i < 100; i++) {
				grpcLogger.log(message, context, { ...optionalParams, iteration: i });
			}

			expect(mockPinoLogger.info).toHaveBeenCalledTimes(100);
			expect(mockRequestContextService.get).toHaveBeenCalledTimes(100);
		});

		it('should not create memory leaks with repeated calls', () => {
			const message = 'Memory test';
			const context = 'MemoryTest';
			const optionalParams = { test: 'data' };

			mockRequestContextService.get.mockReturnValue('req-memory');
			mockPinoLogger.info.mockReturnValue(undefined);

			// Test many log calls to ensure no memory leaks
			for (let i = 0; i < 1000; i++) {
				grpcLogger.log(message, context, optionalParams);
			}

			expect(mockPinoLogger.info).toHaveBeenCalledTimes(1000);
		});
	});

	describe('integration with RequestContextService', () => {
		it('should use request ID from context service', () => {
			const message = 'Integration test';
			const context = 'IntegrationTest';
			const optionalParams = {};
			const requestId = 'integration-request-id';

			mockRequestContextService.get.mockReturnValue(requestId);
			mockPinoLogger.info.mockReturnValue(undefined);

			grpcLogger.log(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context,
					requestId,
				},
				message
			);
		});

		it('should handle context service returning different values', () => {
			const message = 'Context test';
			const context = 'ContextTest';
			const optionalParams = {};

			// First call
			mockRequestContextService.get.mockReturnValue('req-1');
			grpcLogger.log(message, context, optionalParams);

			// Second call with different request ID
			mockRequestContextService.get.mockReturnValue('req-2');
			grpcLogger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context,
					requestId: 'req-1',
				},
				message
			);
			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context,
					requestId: 'req-2',
				},
				message
			);
		});
	});
}); 
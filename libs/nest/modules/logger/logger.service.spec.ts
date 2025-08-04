import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from './logger.service';
import { PinoLogger } from 'nestjs-pino';
import { RequestContextService } from './request-context.service';

describe('Logger', () => {
	let logger: Logger;
	let mockPinoLogger: PinoLogger;
	let mockRequestContextService: RequestContextService;

	beforeEach(() => {
		mockPinoLogger = {
			info: vi.fn(),
			error: vi.fn(),
			fatal: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		} as any;

		mockRequestContextService = {
			get: vi.fn(),
		} as any;

		logger = new Logger(mockPinoLogger, mockRequestContextService);
	});

	describe('log', () => {
		it('should log info message with context and request ID', () => {
			const message = 'Test message';
			const context = 'TestContext';
			const optionalParams = { key: 'value' };
			mockRequestContextService.get.mockReturnValue('req-123');

			logger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					key: 'value',
					context: 'TestContext',
					requestId: 'req-123',
				},
				'Test message',
			);
		});

		it('should log info message without request ID when not available', () => {
			const message = 'Test message';
			const context = 'TestContext';
			const optionalParams = { key: 'value' };
			mockRequestContextService.get.mockReturnValue(undefined);

			logger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					key: 'value',
					context: 'TestContext',
				},
				'Test message',
			);
		});

		it('should log info message with empty optional params', () => {
			const message = 'Test message';
			const context = 'TestContext';
			const optionalParams = {};
			mockRequestContextService.get.mockReturnValue('req-123');

			logger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					requestId: 'req-123',
				},
				'Test message',
			);
		});
	});

	describe('error', () => {
		it('should log error message with context and request ID', () => {
			const message = 'Error message';
			const context = 'ErrorContext';
			const optionalParams = { error: 'details' };
			mockRequestContextService.get.mockReturnValue('req-123');

			logger.error(message, context, optionalParams);

			expect(mockPinoLogger.error).toHaveBeenCalledWith(
				{
					error: 'details',
					context: 'ErrorContext',
					requestId: 'req-123',
				},
				'Error message',
			);
		});

		it('should log error message without request ID when not available', () => {
			const message = 'Error message';
			const context = 'ErrorContext';
			const optionalParams = { error: 'details' };
			mockRequestContextService.get.mockReturnValue(undefined);

			logger.error(message, context, optionalParams);

			expect(mockPinoLogger.error).toHaveBeenCalledWith(
				{
					error: 'details',
					context: 'ErrorContext',
				},
				'Error message',
			);
		});
	});

	describe('fatal', () => {
		it('should log fatal message with context and request ID', () => {
			const message = 'Fatal message';
			const context = 'FatalContext';
			const optionalParams = { fatal: 'details' };
			mockRequestContextService.get.mockReturnValue('req-123');

			logger.fatal(message, context, optionalParams);

			expect(mockPinoLogger.fatal).toHaveBeenCalledWith(
				{
					fatal: 'details',
					context: 'FatalContext',
					requestId: 'req-123',
				},
				'Fatal message',
			);
		});
	});

	describe('warn', () => {
		it('should log warn message with context and request ID', () => {
			const message = 'Warning message';
			const context = 'WarningContext';
			const optionalParams = { warning: 'details' };
			mockRequestContextService.get.mockReturnValue('req-123');

			logger.warn(message, context, optionalParams);

			expect(mockPinoLogger.warn).toHaveBeenCalledWith(
				{
					warning: 'details',
					context: 'WarningContext',
					requestId: 'req-123',
				},
				'Warning message',
			);
		});
	});

	describe('debug', () => {
		it('should log debug message with context and request ID', () => {
			const message = 'Debug message';
			const context = 'DebugContext';
			const optionalParams = { debug: 'details' };
			mockRequestContextService.get.mockReturnValue('req-123');

			logger.debug!(message, context, optionalParams);

			expect(mockPinoLogger.debug).toHaveBeenCalledWith(
				{
					debug: 'details',
					context: 'DebugContext',
					requestId: 'req-123',
				},
				'Debug message',
			);
		});
	});

	describe('verbose', () => {
		it('should log verbose message with context and request ID', () => {
			const message = 'Verbose message';
			const context = 'VerboseContext';
			const optionalParams = { verbose: 'details' };
			mockRequestContextService.get.mockReturnValue('req-123');

			logger.verbose!(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					verbose: 'details',
					context: 'VerboseContext',
					requestId: 'req-123',
				},
				'Verbose message',
			);
		});
	});

	describe('request ID handling', () => {
		it('should get request ID from RequestContextService for gRPC', () => {
			const message = 'Test message';
			const context = 'TestContext';
			const optionalParams = {};
			mockRequestContextService.get.mockReturnValue('grpc-req-123');

			logger.log(message, context, optionalParams);

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					requestId: 'grpc-req-123',
				},
				'Test message',
			);
		});

		it('should not include requestId in log when not available', () => {
			const message = 'Test message';
			const context = 'TestContext';
			const optionalParams = {};
			mockRequestContextService.get.mockReturnValue(undefined);

			logger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
				},
				'Test message',
			);
		});
	});
}); 
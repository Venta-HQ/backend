import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from './logger.service';

describe('Logger', () => {
	let logger: Logger;
	let mockPinoLogger: any;
	let mockRequestContextService: any;

	beforeEach(() => {
		mockPinoLogger = {
			debug: vi.fn(),
			error: vi.fn(),
			fatal: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
		};

		mockRequestContextService = {
			get: vi.fn(),
		};

		logger = new Logger(mockPinoLogger, mockRequestContextService);
	});

	it('should be defined', () => {
		expect(logger).toBeDefined();
	});

	describe('log', () => {
		it('should call pino logger info with correct parameters', () => {
			const message = 'test message';
			const context = 'TestContext';
			const optionalParams = { key: 'value' };

			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					key: 'value',
					requestId: 'test-request-id',
				},
				'test message',
			);
		});

		it('should call pino logger info without requestId when not available', () => {
			const message = 'test message';
			const context = 'TestContext';
			const optionalParams = { key: 'value' };

			mockRequestContextService.get.mockReturnValue(undefined);

			logger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					key: 'value',
				},
				'test message',
			);
		});

		it('should call pino logger info with empty optionalParams', () => {
			const message = 'test message';
			const context = 'TestContext';
			const optionalParams = {};

			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.log(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					requestId: 'test-request-id',
				},
				'test message',
			);
		});
	});

	describe('error', () => {
		it('should call pino logger error with correct parameters', () => {
			const message = 'error message';
			const context = 'TestContext';
			const optionalParams = { error: 'details' };

			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.error(message, context, optionalParams);

			expect(mockPinoLogger.error).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					error: 'details',
					requestId: 'test-request-id',
				},
				'error message',
			);
		});

		it('should call pino logger error without requestId when not available', () => {
			const message = 'error message';
			const context = 'TestContext';
			const optionalParams = { error: 'details' };

			mockRequestContextService.get.mockReturnValue(undefined);

			logger.error(message, context, optionalParams);

			expect(mockPinoLogger.error).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					error: 'details',
				},
				'error message',
			);
		});
	});

	describe('fatal', () => {
		it('should call pino logger fatal with correct parameters', () => {
			const message = 'fatal message';
			const context = 'TestContext';
			const optionalParams = { fatal: 'details' };

			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.fatal(message, context, optionalParams);

			expect(mockPinoLogger.fatal).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					fatal: 'details',
					requestId: 'test-request-id',
				},
				'fatal message',
			);
		});

		it('should call pino logger fatal without requestId when not available', () => {
			const message = 'fatal message';
			const context = 'TestContext';
			const optionalParams = { fatal: 'details' };

			mockRequestContextService.get.mockReturnValue(undefined);

			logger.fatal(message, context, optionalParams);

			expect(mockPinoLogger.fatal).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					fatal: 'details',
				},
				'fatal message',
			);
		});
	});

	describe('warn', () => {
		it('should call pino logger warn with correct parameters', () => {
			const message = 'warning message';
			const context = 'TestContext';
			const optionalParams = { warning: 'details' };

			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.warn(message, context, optionalParams);

			expect(mockPinoLogger.warn).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					requestId: 'test-request-id',
					warning: 'details',
				},
				'warning message',
			);
		});

		it('should call pino logger warn without requestId when not available', () => {
			const message = 'warning message';
			const context = 'TestContext';
			const optionalParams = { warning: 'details' };

			mockRequestContextService.get.mockReturnValue(undefined);

			logger.warn(message, context, optionalParams);

			expect(mockPinoLogger.warn).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					warning: 'details',
				},
				'warning message',
			);
		});
	});

	describe('debug', () => {
		it('should call pino logger debug with correct parameters', () => {
			const message = 'debug message';
			const context = 'TestContext';
			const optionalParams = { debug: 'details' };

			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.debug!(message, context, optionalParams);

			expect(mockPinoLogger.debug).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					debug: 'details',
					requestId: 'test-request-id',
				},
				'debug message',
			);
		});

		it('should call pino logger debug without requestId when not available', () => {
			const message = 'debug message';
			const context = 'TestContext';
			const optionalParams = { debug: 'details' };

			mockRequestContextService.get.mockReturnValue(undefined);

			logger.debug!(message, context, optionalParams);

			expect(mockPinoLogger.debug).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					debug: 'details',
				},
				'debug message',
			);
		});
	});

	describe('verbose', () => {
		it('should call pino logger info with correct parameters for verbose', () => {
			const message = 'verbose message';
			const context = 'TestContext';
			const optionalParams = { verbose: 'details' };

			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.verbose!(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					requestId: 'test-request-id',
					verbose: 'details',
				},
				'verbose message',
			);
		});

		it('should call pino logger info without requestId when not available for verbose', () => {
			const message = 'verbose message';
			const context = 'TestContext';
			const optionalParams = { verbose: 'details' };

			mockRequestContextService.get.mockReturnValue(undefined);

			logger.verbose!(message, context, optionalParams);

			expect(mockPinoLogger.info).toHaveBeenCalledWith(
				{
					context: 'TestContext',
					verbose: 'details',
				},
				'verbose message',
			);
		});
	});

	describe('getRequestId', () => {
		it('should return requestId from RequestContextService when available', () => {
			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.log('test', 'context', {});

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
		});

		it('should return undefined when requestId is not available', () => {
			mockRequestContextService.get.mockReturnValue(undefined);

			logger.log('test', 'context', {});

			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
		});

		it('should handle multiple log calls with same requestId', () => {
			mockRequestContextService.get.mockReturnValue('test-request-id');

			logger.log('test1', 'context', {});
			logger.log('test2', 'context', {});

			expect(mockRequestContextService.get).toHaveBeenCalledTimes(2);
			expect(mockRequestContextService.get).toHaveBeenCalledWith('requestId');
		});

		it('should handle log calls with different requestIds', () => {
			mockRequestContextService.get.mockReturnValueOnce('request-id-1').mockReturnValueOnce('request-id-2');

			logger.log('test1', 'context', {});
			logger.log('test2', 'context', {});

			expect(mockRequestContextService.get).toHaveBeenCalledTimes(2);
		});

		it('should handle log calls with and without requestId', () => {
			mockRequestContextService.get.mockReturnValueOnce('request-id-1').mockReturnValueOnce(undefined);

			logger.log('test1', 'context', {});
			logger.log('test2', 'context', {});

			expect(mockRequestContextService.get).toHaveBeenCalledTimes(2);
		});
	});
});

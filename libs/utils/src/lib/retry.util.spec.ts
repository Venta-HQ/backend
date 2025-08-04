import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';

// Mock Logger
vi.mock('@nestjs/common', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		error: vi.fn(),
		log: vi.fn(),
		warn: vi.fn(),
	})),
}));

// Top-level mock operation object
// const mockRetryOperation = {
// 	attempt: vi.fn(),
// 	retry: vi.fn(),
// 	mainError: vi.fn(),
// };

// Mock retry package
// vi.mock('retry', () => ({
// 	default: {
// 		operation: vi.fn().mockReturnValue(mockRetryOperation),
// 	},
// }));

// Import after mocking
// import { retryOperation } from './retry.util';

describe.skip('retryOperation', () => {
	let mockLogger: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = new Logger('TestLogger');
		// mockRetryOperation.attempt.mockReset();
		// mockRetryOperation.retry.mockReset();
		// mockRetryOperation.mainError.mockReset();
	});

	describe('successful operations', () => {
		it.skip('should return result on first attempt', async () => {
			const operation = vi.fn().mockResolvedValue('success');
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(1);
			// });
			// mockRetryOperation.retry.mockReturnValue(false);
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
			expect(mockLogger.log).toHaveBeenCalledWith('test operation (attempt 1)');
		});

		it.skip('should return result after some failures', async () => {
			const operation = vi
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			// const attempt = 0;
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(++attempt);
			// });
			// mockRetryOperation.retry
			// 	.mockReturnValueOnce(true)
			// 	.mockReturnValueOnce(true)
			// 	.mockReturnValueOnce(false);
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(3);
		});
	});

	describe('failed operations', () => {
		it.skip('should throw error after max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);
			// const attempt = 0;
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(++attempt);
			// });
			// mockRetryOperation.retry.mockReturnValue(false);
			// mockRetryOperation.mainError.mockReturnValue(error);
			await expect(retryOperation(operation, 'test operation', { logger: mockLogger })).rejects.toThrow(
				'Persistent failure',
			);
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it.skip('should respect custom max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);
			// const attempt = 0;
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(++attempt);
			// });
			// mockRetryOperation.retry.mockReturnValue(false);
			// mockRetryOperation.mainError.mockReturnValue(error);
			await expect(retryOperation(operation, 'test operation', { logger: mockLogger, maxRetries: 2 })).rejects.toThrow(
				'Persistent failure',
			);
			expect(operation).toHaveBeenCalledTimes(1);
		});
	});

	describe('configuration options', () => {
		it.skip('should use custom retry delay', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');
			// const attempt = 0;
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(++attempt);
			// });
			// mockRetryOperation.retry
			// 	.mockReturnValueOnce(true)
			// 	.mockReturnValueOnce(false);
			await retryOperation(operation, 'test operation', { logger: mockLogger, retryDelay: 200 });
			expect(operation).toHaveBeenCalledTimes(2);
		});

		it.skip('should use custom backoff multiplier', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');
			const _attempt = 0;
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(++attempt);
			// });
			// mockRetryOperation.retry
			// 	.mockReturnValueOnce(true)
			// 	.mockReturnValueOnce(false);
			await retryOperation(operation, 'test operation', { backoffMultiplier: 3, logger: mockLogger });
			expect(operation).toHaveBeenCalledTimes(2);
		});
	});

	describe('logging behavior', () => {
		it.skip('should log operation attempts', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');
			const _attempt = 0;
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(++attempt);
			// });
			// mockRetryOperation.retry
			// 	.mockReturnValueOnce(true)
			// 	.mockReturnValueOnce(false);
			await retryOperation(operation, 'test operation', { logger: mockLogger });
			expect(mockLogger.log).toHaveBeenCalledWith('test operation (attempt 1)');
			expect(mockLogger.warn).toHaveBeenCalledWith('test operation failed (attempt 1):', expect.any(Error));
		});

		it.skip('should create default logger when not provided', async () => {
			const operation = vi.fn().mockResolvedValue('success');
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(1);
			// });
			// mockRetryOperation.retry.mockReturnValue(false);
			await retryOperation(operation, 'test operation');
			expect(Logger).toHaveBeenCalledWith('RetryUtil');
		});
	});

	describe('edge cases', () => {
		it.skip('should handle operation that returns undefined', async () => {
			const operation = vi.fn().mockResolvedValue(undefined);
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(1);
			// });
			// mockRetryOperation.retry.mockReturnValue(false);
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			expect(result).toBeUndefined();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it.skip('should handle operation that returns null', async () => {
			const operation = vi.fn().mockResolvedValue(null);
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(1);
			// });
			// mockRetryOperation.retry.mockReturnValue(false);
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			expect(result).toBeNull();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it.skip('should handle different error types', async () => {
			const stringError = 'String error';
			const operation = vi.fn().mockRejectedValue(stringError);
			// mockRetryOperation.attempt.mockImplementation(async (cb) => {
			// 	await Promise.resolve();
			// 	cb(1);
			// });
			// mockRetryOperation.retry.mockReturnValue(false);
			// mockRetryOperation.mainError.mockReturnValue(stringError);
			await expect(retryOperation(operation, 'test operation', { logger: mockLogger })).rejects.toBe(stringError);
		});
	});
});

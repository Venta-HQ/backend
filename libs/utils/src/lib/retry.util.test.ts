import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { RetryOptions, RetryUtil } from './retry.util';

describe('RetryUtil', () => {
	let mockLogger: Logger;
	let retryUtil: RetryUtil;

	beforeEach(() => {
		mockLogger = {
			log: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as any;

		retryUtil = new RetryUtil({ logger: mockLogger });
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('constructor', () => {
		it('should use default options when none provided', () => {
			const defaultRetryUtil = new RetryUtil();
			expect(defaultRetryUtil).toBeDefined();
		});

		it('should use custom options when provided', () => {
			const options: RetryOptions = {
				maxRetries: 5,
				retryDelay: 2000,
				backoffMultiplier: 3,
				logger: mockLogger,
			};

			const customRetryUtil = new RetryUtil(options);
			expect(customRetryUtil).toBeDefined();
		});
	});

	describe('retryOperation - success cases', () => {
		it('should return result immediately on success', async () => {
			const operation = vi.fn().mockResolvedValue('success');
			const description = 'Test operation';

			const result = await retryUtil.retryOperation(operation, description);

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
			expect(mockLogger.log).toHaveBeenCalledWith(description);
		});

		it('should handle async operations', async () => {
			const operation = vi.fn().mockResolvedValue({ data: 'test' });
			const description = 'Async operation';

			const result = await retryUtil.retryOperation(operation, description);

			expect(result).toEqual({ data: 'test' });
			expect(operation).toHaveBeenCalledTimes(1);
		});
	});

	describe('retryOperation - retry cases', () => {
		it('should retry on failure and succeed', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');

			const description = 'Retry operation';

			const resultPromise = retryUtil.retryOperation(operation, description);

			// Fast-forward through the delay
			await vi.advanceTimersByTimeAsync(1000); // Retry delay

			const result = await resultPromise;

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(2);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining('failed (attempt 1/4), retrying in 1000ms:'),
				expect.any(Error),
			);
		});

		it('should use exponential backoff', async () => {
			const operation = vi
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			const description = 'Exponential backoff test';

			const resultPromise = retryUtil.retryOperation(operation, description);

			// Fast-forward through all delays
			await vi.advanceTimersByTimeAsync(1000); // First retry delay
			await vi.advanceTimersByTimeAsync(2000); // Second retry delay

			const result = await resultPromise;

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(3);
		});

		it('should respect maxRetries limit', async () => {
			const operation = vi.fn().mockImplementation(() => {
				throw new Error('Always fails');
			});
			const description = 'Max retries test';

			const resultPromise = retryUtil.retryOperation(operation, description);

			// Fast-forward through all delays
			await vi.advanceTimersByTimeAsync(1000); // Initial delay
			await vi.advanceTimersByTimeAsync(2000); // First retry delay
			await vi.advanceTimersByTimeAsync(4000); // Second retry delay
			await vi.advanceTimersByTimeAsync(8000); // Third retry delay

			await expect(resultPromise).rejects.toThrow('Always fails');

			expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('failed after 4 attempts:'),
				expect.any(Error),
			);
		});
	});

	describe('retryOperation - custom configuration', () => {
		it('should use custom maxRetries', async () => {
			const customRetryUtil = new RetryUtil({ maxRetries: 1, logger: mockLogger });
			const operation = vi.fn().mockImplementation(() => {
				throw new Error('Always fails');
			});
			const description = 'Custom max retries';

			const resultPromise = customRetryUtil.retryOperation(operation, description);

			// Fast-forward through the delay
			await vi.advanceTimersByTimeAsync(1000); // Initial delay
			await vi.advanceTimersByTimeAsync(2000); // First retry delay

			await expect(resultPromise).rejects.toThrow('Always fails');

			expect(operation).toHaveBeenCalledTimes(2); // Initial + 1 retry
		});

		it('should use custom retryDelay', async () => {
			const customRetryUtil = new RetryUtil({ retryDelay: 500, logger: mockLogger });
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');

			const description = 'Custom delay test';

			const resultPromise = customRetryUtil.retryOperation(operation, description);

			// Fast-forward through the delay
			await vi.advanceTimersByTimeAsync(500); // Custom retry delay

			const result = await resultPromise;

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(2);
		});

		it('should use custom backoffMultiplier', async () => {
			const customRetryUtil = new RetryUtil({ backoffMultiplier: 3, logger: mockLogger });
			const operation = vi
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			const description = 'Custom backoff test';

			const resultPromise = customRetryUtil.retryOperation(operation, description);

			// Fast-forward through all delays
			await vi.advanceTimersByTimeAsync(1000); // First retry delay (1000 * 1)
			await vi.advanceTimersByTimeAsync(3000); // Second retry delay (1000 * 3)

			const result = await resultPromise;

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(3);
		});
	});

	describe('static retry method', () => {
		it('should work as a static method', async () => {
			const operation = vi.fn().mockResolvedValue('static success');
			const description = 'Static method test';

			const result = await RetryUtil.retry(operation, description);

			expect(result).toBe('static success');
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should accept options in static method', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');

			const description = 'Static method with options';
			const options: RetryOptions = { maxRetries: 1, logger: mockLogger };

			const resultPromise = RetryUtil.retry(operation, description, options);

			// Fast-forward through the delay
			await vi.advanceTimersByTimeAsync(1000); // Retry delay

			const result = await resultPromise;

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(2);
		});
	});

	describe('error handling', () => {
		it('should preserve original error details', async () => {
			const originalError = new Error('Custom error message');
			const operation = vi.fn().mockImplementation(() => {
				throw originalError;
			});
			const description = 'Error preservation test';

			const resultPromise = retryUtil.retryOperation(operation, description);

			// Fast-forward through all delays
			await vi.advanceTimersByTimeAsync(1000); // Initial delay
			await vi.advanceTimersByTimeAsync(2000); // First retry delay
			await vi.advanceTimersByTimeAsync(4000); // Second retry delay
			await vi.advanceTimersByTimeAsync(8000); // Third retry delay

			await expect(resultPromise).rejects.toThrow('Custom error message');

			expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('failed after 4 attempts:'), originalError);
		});

		it('should handle non-Error objects', async () => {
			const operation = vi.fn().mockImplementation(() => {
				throw 'String error';
			});
			const description = 'Non-Error test';

			const resultPromise = retryUtil.retryOperation(operation, description);

			// Fast-forward through all delays
			await vi.advanceTimersByTimeAsync(1000); // Initial delay
			await vi.advanceTimersByTimeAsync(2000); // First retry delay
			await vi.advanceTimersByTimeAsync(4000); // Second retry delay
			await vi.advanceTimersByTimeAsync(8000); // Third retry delay

			await expect(resultPromise).rejects.toBe('String error');
		});
	});

	describe('logging', () => {
		it('should log success operations', async () => {
			const operation = vi.fn().mockResolvedValue('success');
			const description = 'Logging test';

			await retryUtil.retryOperation(operation, description);

			expect(mockLogger.log).toHaveBeenCalledWith(description);
		});

		it('should log retry attempts with correct attempt numbers', async () => {
			const operation = vi
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			const description = 'Retry logging test';

			const resultPromise = retryUtil.retryOperation(operation, description);

			// Fast-forward through all delays
			await vi.advanceTimersByTimeAsync(1000); // First retry delay
			await vi.advanceTimersByTimeAsync(2000); // Second retry delay

			await resultPromise;

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining('failed (attempt 1/4), retrying in 1000ms:'),
				expect.any(Error),
			);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining('failed (attempt 2/4), retrying in 2000ms:'),
				expect.any(Error),
			);
		});

		it('should log final failure', async () => {
			const operation = vi.fn().mockImplementation(() => {
				throw new Error('Always fails');
			});
			const description = 'Final failure logging';

			const resultPromise = retryUtil.retryOperation(operation, description);

			// Fast-forward through all delays
			await vi.advanceTimersByTimeAsync(1000); // Initial delay
			await vi.advanceTimersByTimeAsync(2000); // First retry delay
			await vi.advanceTimersByTimeAsync(4000); // Second retry delay
			await vi.advanceTimersByTimeAsync(8000); // Third retry delay

			await expect(resultPromise).rejects.toThrow('Always fails');

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('failed after 4 attempts:'),
				expect.any(Error),
			);
		});
	});
});

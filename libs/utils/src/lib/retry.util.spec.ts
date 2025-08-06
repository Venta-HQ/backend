import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { retryObservable, retryOperation } from './retry.util';

// Mock Logger
vi.mock('@nestjs/common', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		error: vi.fn(),
		log: vi.fn(),
		warn: vi.fn(),
	})),
}));

describe('retryOperation', () => {
	let mockLogger: any;
	let mockDelayFn: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = new Logger('TestLogger');
		mockDelayFn = vi.fn().mockResolvedValue(undefined);
	});

	describe('successful operations', () => {
		it('should return result on first attempt', async () => {
			const operation = vi.fn().mockResolvedValue('success');

			const result = await retryOperation(operation, 'test operation', {
				delayFn: mockDelayFn,
				logger: mockLogger,
			});

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
			expect(mockDelayFn).not.toHaveBeenCalled();
		});

		it('should return result after some failures', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');

			const result = await retryOperation(operation, 'test operation', {
				delayFn: mockDelayFn,
				logger: mockLogger,
			});

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(2);
			expect(mockDelayFn).toHaveBeenCalledTimes(1);
			expect(mockDelayFn).toHaveBeenCalledWith(1000);
			expect(mockLogger.warn).toHaveBeenCalledWith('test operation failed (attempt 1):', expect.any(Error));
		});
	});

	describe('failed operations', () => {
		it('should throw error after max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);

			await expect(
				retryOperation(operation, 'test operation', {
					delayFn: mockDelayFn,
					logger: mockLogger,
				}),
			).rejects.toThrow('Persistent failure');

			expect(operation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
			expect(mockDelayFn).toHaveBeenCalledTimes(3);
		});

		it('should respect custom max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);

			await expect(
				retryOperation(operation, 'test operation', {
					delayFn: mockDelayFn,
					logger: mockLogger,
					maxRetries: 2,
				}),
			).rejects.toThrow('Persistent failure');

			expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
			expect(mockDelayFn).toHaveBeenCalledTimes(2);
		});
	});

	describe('configuration options', () => {
		it('should use custom retry delay', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');

			await retryOperation(operation, 'test operation', {
				delayFn: mockDelayFn,
				logger: mockLogger,
				retryDelay: 200,
			});

			expect(operation).toHaveBeenCalledTimes(2);
			expect(mockDelayFn).toHaveBeenCalledWith(200);
		});

		it('should use custom backoff multiplier', async () => {
			const operation = vi
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			await retryOperation(operation, 'test operation', {
				backoffMultiplier: 3,
				delayFn: mockDelayFn,
				logger: mockLogger,
			});

			expect(operation).toHaveBeenCalledTimes(3);
			expect(mockDelayFn).toHaveBeenCalledWith(1000); // First retry: 1000 * (3^0)
			expect(mockDelayFn).toHaveBeenCalledWith(3000); // Second retry: 1000 * (3^1)
		});
	});

	describe('logging behavior', () => {
		it('should log operation attempts', async () => {
			const operation = vi.fn().mockRejectedValueOnce(new Error('First failure')).mockResolvedValue('success');

			await retryOperation(operation, 'test operation', {
				delayFn: mockDelayFn,
				logger: mockLogger,
			});

			expect(mockLogger.log).toHaveBeenCalledWith('test operation (attempt 1)');
			expect(mockLogger.log).toHaveBeenCalledWith('test operation (attempt 2)');
			expect(mockLogger.warn).toHaveBeenCalledWith('test operation failed (attempt 1):', expect.any(Error));
		});

		it('should create default logger when not provided', async () => {
			const operation = vi.fn().mockResolvedValue('success');

			await retryOperation(operation, 'test operation', { delayFn: mockDelayFn });

			expect(Logger).toHaveBeenCalledWith('RetryUtil');
		});
	});

	describe('edge cases', () => {
		it('should handle operation that returns undefined', async () => {
			const operation = vi.fn().mockResolvedValue(undefined);

			const result = await retryOperation(operation, 'test operation', {
				delayFn: mockDelayFn,
				logger: mockLogger,
			});

			expect(result).toBeUndefined();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should handle operation that returns null', async () => {
			const operation = vi.fn().mockResolvedValue(null);

			const result = await retryOperation(operation, 'test operation', {
				delayFn: mockDelayFn,
				logger: mockLogger,
			});

			expect(result).toBeNull();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should handle different error types', async () => {
			const stringError = 'String error';
			const operation = vi.fn().mockRejectedValue(stringError);

			await expect(
				retryOperation(operation, 'test operation', {
					delayFn: mockDelayFn,
					logger: mockLogger,
				}),
			).rejects.toBe(stringError);
		});
	});
});

describe('retryObservable', () => {
	let mockLogger: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = new Logger('TestLogger');
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('successful operations', () => {
		it('should return result on first attempt', async () => {
			const observable = of('success');

			const resultPromise = retryObservable(observable, 'test observable', { logger: mockLogger }).toPromise();

			// Fast-forward time to complete the operation
			vi.runAllTimers();

			const result = await resultPromise;
			expect(result).toBe('success');
		});

		it('should return result after some failures', async () => {
			let attemptCount = 0;
			const observable = new Observable((subscriber) => {
				attemptCount++;
				if (attemptCount === 1) {
					subscriber.error(new Error('First failure'));
				} else {
					subscriber.next('success');
					subscriber.complete();
				}
			});

			const resultPromise = retryObservable(observable, 'test observable', { logger: mockLogger }).toPromise();

			// Fast-forward time to complete all attempts
			vi.runAllTimers();

			const result = await resultPromise;
			expect(result).toBe('success');
			expect(mockLogger.warn).toHaveBeenCalledWith('test observable failed (attempt 1):', expect.any(Error));
		});
	});

	describe('failed operations', () => {
		it('should throw error after max retries', async () => {
			const error = new Error('Persistent failure');
			const observable = throwError(() => error);

			const resultPromise = retryObservable(observable, 'test observable', { logger: mockLogger }).toPromise();

			// Fast-forward time to complete all attempts
			vi.runAllTimers();

			await expect(resultPromise).rejects.toThrow('Persistent failure');
		});

		it('should respect custom max retries', async () => {
			const error = new Error('Persistent failure');
			const observable = throwError(() => error);

			const resultPromise = retryObservable(observable, 'test observable', {
				logger: mockLogger,
				maxRetries: 2,
			}).toPromise();

			// Fast-forward time to complete all attempts
			vi.runAllTimers();

			await expect(resultPromise).rejects.toThrow('Persistent failure');
		});
	});

	describe('configuration options', () => {
		it('should use custom retry delay', async () => {
			let attemptCount = 0;
			const observable = new Observable((subscriber) => {
				attemptCount++;
				if (attemptCount === 1) {
					subscriber.error(new Error('First failure'));
				} else {
					subscriber.next('success');
					subscriber.complete();
				}
			});

			const resultPromise = retryObservable(observable, 'test observable', {
				logger: mockLogger,
				retryDelay: 200,
			}).toPromise();

			// Fast-forward time to complete all attempts
			vi.runAllTimers();

			await resultPromise;
			expect(mockLogger.log).toHaveBeenCalledWith('test observable retrying in 200ms (attempt 1)');
		});

		it('should use custom backoff multiplier', async () => {
			let attemptCount = 0;
			const observable = new Observable((subscriber) => {
				attemptCount++;
				if (attemptCount === 1) {
					subscriber.error(new Error('First failure'));
				} else {
					subscriber.next('success');
					subscriber.complete();
				}
			});

			const resultPromise = retryObservable(observable, 'test observable', {
				backoffMultiplier: 3,
				logger: mockLogger,
			}).toPromise();

			// Fast-forward time to complete all attempts
			vi.runAllTimers();

			await resultPromise;
			// The backoff calculation is: retryDelay * (backoffMultiplier ^ (attemptCount - 1))
			// For attempt 1: 1000 * (3 ^ 0) = 1000ms
			expect(mockLogger.log).toHaveBeenCalledWith('test observable retrying in 1000ms (attempt 1)');
		});
	});

	describe('logging behavior', () => {
		it('should log retry attempts', async () => {
			let attemptCount = 0;
			const observable = new Observable((subscriber) => {
				attemptCount++;
				if (attemptCount === 1) {
					subscriber.error(new Error('First failure'));
				} else {
					subscriber.next('success');
					subscriber.complete();
				}
			});

			const resultPromise = retryObservable(observable, 'test observable', { logger: mockLogger }).toPromise();

			// Fast-forward time to complete all attempts
			vi.runAllTimers();

			await resultPromise;
			expect(mockLogger.warn).toHaveBeenCalledWith('test observable failed (attempt 1):', expect.any(Error));
			expect(mockLogger.log).toHaveBeenCalledWith('test observable retrying in 1000ms (attempt 1)');
		});

		it('should create default logger when not provided', async () => {
			const observable = of('success');

			const resultPromise = retryObservable(observable, 'test observable').toPromise();

			// Fast-forward time to complete the operation
			vi.runAllTimers();

			await resultPromise;
			expect(Logger).toHaveBeenCalledWith('RetryUtil');
		});
	});

	describe('edge cases', () => {
		it('should handle observable that emits undefined', async () => {
			const observable = of(undefined);

			const resultPromise = retryObservable(observable, 'test observable', { logger: mockLogger }).toPromise();

			// Fast-forward time to complete the operation
			vi.runAllTimers();

			const result = await resultPromise;
			expect(result).toBeUndefined();
		});

		it('should handle observable that emits null', async () => {
			const observable = of(null);

			const resultPromise = retryObservable(observable, 'test observable', { logger: mockLogger }).toPromise();

			// Fast-forward time to complete the operation
			vi.runAllTimers();

			const result = await resultPromise;
			expect(result).toBeNull();
		});

		it('should handle different error types', async () => {
			const stringError = 'String error';
			const observable = throwError(() => stringError);

			const resultPromise = retryObservable(observable, 'test observable', { logger: mockLogger }).toPromise();

			// Fast-forward time to complete all attempts
			vi.runAllTimers();

			await expect(resultPromise).rejects.toBe(stringError);
		});
	});
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '@nestjs/common';

// Mock Logger
vi.mock('@nestjs/common', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		error: vi.fn(),
		warn: vi.fn(),
		log: vi.fn(),
	})),
}));

// Mock retry package
vi.mock('retry', () => {
	const mockRetryOperation = {
		attempt: vi.fn(),
		retry: vi.fn(),
		mainError: vi.fn(),
	};
	
	return {
		default: {
			operation: vi.fn().mockReturnValue(mockRetryOperation),
		},
	};
});

// Import after mocking
import { retryOperation } from './retry.util';
import retry from 'retry';

describe('retryOperation', () => {
	let mockLogger: any;
	let mockRetryOperation: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = new Logger('TestLogger');
		
		// Get the mocked retry operation using vi.mocked
		const mockedRetry = vi.mocked(retry);
		mockRetryOperation = mockedRetry.operation();
	});

	describe('successful operations', () => {
		it('should return result on first attempt', async () => {
			const operation = vi.fn().mockResolvedValue('success');
			
			// Mock successful first attempt
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});

			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
			expect(mockLogger.log).toHaveBeenCalledWith('test operation (attempt 1)');
		});

		it('should return result after some failures', async () => {
			const operation = vi.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			// Mock retry attempts
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			mockRetryOperation.retry.mockReturnValueOnce(true); // First retry
			mockRetryOperation.retry.mockReturnValueOnce(true); // Second retry
			mockRetryOperation.retry.mockReturnValueOnce(false); // No more retries

			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(3);
		});
	});

	describe('failed operations', () => {
		it('should throw error after max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);

			// Mock failed attempts
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			mockRetryOperation.retry.mockReturnValue(false); // No more retries
			mockRetryOperation.mainError.mockReturnValue(error);

			await expect(retryOperation(operation, 'test operation', { logger: mockLogger })).rejects.toThrow('Persistent failure');
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should respect custom max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);

			// Mock failed attempts
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			mockRetryOperation.retry.mockReturnValue(false); // No more retries
			mockRetryOperation.mainError.mockReturnValue(error);

			await expect(retryOperation(operation, 'test operation', { 
				logger: mockLogger, 
				maxRetries: 2 
			})).rejects.toThrow('Persistent failure');
			expect(operation).toHaveBeenCalledTimes(1);
		});
	});

	describe('configuration options', () => {
		it('should use custom retry delay', async () => {
			const operation = vi.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockResolvedValue('success');

			// Mock retry attempts
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			mockRetryOperation.retry.mockReturnValueOnce(true); // First retry
			mockRetryOperation.retry.mockReturnValueOnce(false); // No more retries

			await retryOperation(operation, 'test operation', { 
				logger: mockLogger, 
				retryDelay: 200 
			});

			expect(operation).toHaveBeenCalledTimes(2);
		});

		it('should use custom backoff multiplier', async () => {
			const operation = vi.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockResolvedValue('success');

			// Mock retry attempts
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			mockRetryOperation.retry.mockReturnValueOnce(true); // First retry
			mockRetryOperation.retry.mockReturnValueOnce(false); // No more retries

			await retryOperation(operation, 'test operation', { 
				logger: mockLogger, 
				backoffMultiplier: 3 
			});

			expect(operation).toHaveBeenCalledTimes(2);
		});
	});

	describe('logging behavior', () => {
		it('should log operation attempts', async () => {
			const operation = vi.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockResolvedValue('success');

			// Mock retry attempts
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			mockRetryOperation.retry.mockReturnValueOnce(true); // First retry
			mockRetryOperation.retry.mockReturnValueOnce(false); // No more retries

			await retryOperation(operation, 'test operation', { logger: mockLogger });

			expect(mockLogger.log).toHaveBeenCalledWith('test operation (attempt 1)');
			expect(mockLogger.warn).toHaveBeenCalledWith('test operation failed (attempt 1):', expect.any(Error));
		});

		it('should create default logger when not provided', async () => {
			const operation = vi.fn().mockResolvedValue('success');

			// Mock successful attempt
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});

			await retryOperation(operation, 'test operation');

			expect(Logger).toHaveBeenCalledWith('RetryUtil');
		});
	});

	describe('edge cases', () => {
		it('should handle operation that returns undefined', async () => {
			const operation = vi.fn().mockResolvedValue(undefined);
			
			// Mock successful attempt
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			
			expect(result).toBeUndefined();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should handle operation that returns null', async () => {
			const operation = vi.fn().mockResolvedValue(null);
			
			// Mock successful attempt
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			
			expect(result).toBeNull();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should handle different error types', async () => {
			const stringError = 'String error';
			const operation = vi.fn().mockRejectedValue(stringError);

			// Mock failed attempt
			mockRetryOperation.attempt.mockImplementation((callback) => {
				callback(1);
			});
			mockRetryOperation.retry.mockReturnValue(false); // No more retries
			mockRetryOperation.mainError.mockReturnValue(stringError);

			await expect(retryOperation(operation, 'test operation', { logger: mockLogger })).rejects.toBe(stringError);
		});
	});
}); 
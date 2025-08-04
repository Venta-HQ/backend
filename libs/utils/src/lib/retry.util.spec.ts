import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '@nestjs/common';
import { retryOperation } from './retry.util';

// Mock Logger
vi.mock('@nestjs/common', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		error: vi.fn(),
		warn: vi.fn(),
		log: vi.fn(),
	})),
}));

// Mock retry package
vi.mock('retry', () => ({
	default: {
		operation: vi.fn().mockImplementation((options) => ({
			attempt: vi.fn(),
			retry: vi.fn(),
			mainError: vi.fn(),
		})),
	},
}));

describe('retryOperation', () => {
	let mockLogger: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = new Logger('TestLogger');
	});

	describe('successful operations', () => {
		it('should return result on first attempt', async () => {
			const operation = vi.fn().mockResolvedValue('success');
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should return result after some failures', async () => {
			const operation = vi.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(3);
		});
	});

	describe('failed operations', () => {
		it('should throw error after max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);

			await expect(retryOperation(operation, 'test operation', { logger: mockLogger })).rejects.toThrow('Persistent failure');
			expect(operation).toHaveBeenCalledTimes(3); // Default max retries
		});

		it('should respect custom max retries', async () => {
			const error = new Error('Persistent failure');
			const operation = vi.fn().mockRejectedValue(error);

			await expect(retryOperation(operation, 'test operation', { 
				logger: mockLogger, 
				maxRetries: 2 
			})).rejects.toThrow('Persistent failure');
			expect(operation).toHaveBeenCalledTimes(2);
		});
	});

	describe('configuration options', () => {
		it('should use custom retry delay', async () => {
			const operation = vi.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockResolvedValue('success');

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

			await retryOperation(operation, 'test operation', { logger: mockLogger });

			expect(mockLogger.log).toHaveBeenCalledWith('test operation (attempt 1)');
			expect(mockLogger.warn).toHaveBeenCalledWith('test operation failed (attempt 1):', expect.any(Error));
		});

		it('should create default logger when not provided', async () => {
			const operation = vi.fn().mockResolvedValue('success');

			await retryOperation(operation, 'test operation');

			expect(Logger).toHaveBeenCalledWith('RetryUtil');
		});
	});

	describe('edge cases', () => {
		it('should handle operation that returns undefined', async () => {
			const operation = vi.fn().mockResolvedValue(undefined);
			
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			
			expect(result).toBeUndefined();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should handle operation that returns null', async () => {
			const operation = vi.fn().mockResolvedValue(null);
			
			const result = await retryOperation(operation, 'test operation', { logger: mockLogger });
			
			expect(result).toBeNull();
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should handle different error types', async () => {
			const stringError = 'String error';
			const operation = vi.fn().mockRejectedValue(stringError);

			await expect(retryOperation(operation, 'test operation', { logger: mockLogger })).rejects.toBe(stringError);
		});
	});
}); 
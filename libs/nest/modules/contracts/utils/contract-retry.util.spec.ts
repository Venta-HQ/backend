import { lastValueFrom, of, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
import { ContractRetryUtil } from './contract-retry.util';

describe('ContractRetryUtil', () => {
	let mockLogger: jest.Mocked<Logger>;

	beforeEach(() => {
		mockLogger = {
			error: jest.fn(),
			warn: jest.fn(),
		} as any;
		(ContractRetryUtil as any).logger = mockLogger;
	});

	describe('withRetry', () => {
		it('should succeed on first attempt', async () => {
			const operation = jest.fn().mockResolvedValue('success');

			const result = await ContractRetryUtil.withRetry(operation, 'test operation', { maxRetries: 3 });

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
			expect(mockLogger.warn).not.toHaveBeenCalled();
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it('should retry on retryable error and succeed', async () => {
			const error = new Error('ECONNRESET');
			error.code = 'ECONNRESET';

			const operation = jest
				.fn()
				.mockRejectedValueOnce(error)
				.mockRejectedValueOnce(error)
				.mockResolvedValue('success');

			const result = await ContractRetryUtil.withRetry(operation, 'test operation', {
				maxRetries: 3,
				initialDelayMs: 10,
				maxDelayMs: 100,
			});

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(3);
			expect(mockLogger.warn).toHaveBeenCalledTimes(2);
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it('should fail after max retries', async () => {
			const error = new Error('ECONNRESET');
			error.code = 'ECONNRESET';

			const operation = jest.fn().mockRejectedValue(error);

			await expect(
				ContractRetryUtil.withRetry(operation, 'test operation', {
					maxRetries: 2,
					initialDelayMs: 10,
					maxDelayMs: 100,
				}),
			).rejects.toThrow(error);

			expect(operation).toHaveBeenCalledTimes(2);
			expect(mockLogger.warn).toHaveBeenCalledTimes(1);
			expect(mockLogger.error).toHaveBeenCalledTimes(1);
		});

		it('should not retry on non-retryable error', async () => {
			const error = new Error('Business logic error');
			const operation = jest.fn().mockRejectedValue(error);

			await expect(ContractRetryUtil.withRetry(operation, 'test operation', { maxRetries: 3 })).rejects.toThrow(error);

			expect(operation).toHaveBeenCalledTimes(1);
			expect(mockLogger.warn).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalledTimes(1);
		});
	});

	describe('createRetryOperator', () => {
		it('should succeed on first attempt', async () => {
			const source$ = of('success').pipe(ContractRetryUtil.createRetryOperator('test operation'));

			const result = await lastValueFrom(source$);

			expect(result).toBe('success');
			expect(mockLogger.warn).not.toHaveBeenCalled();
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it('should retry on retryable error and succeed', async () => {
			let attempts = 0;
			const error = new Error('ECONNRESET');
			error.code = 'ECONNRESET';

			const source$ = new Observable((subscriber) => {
				attempts++;
				if (attempts < 3) {
					subscriber.error(error);
				} else {
					subscriber.next('success');
					subscriber.complete();
				}
			}).pipe(
				ContractRetryUtil.createRetryOperator('test operation', {
					maxRetries: 3,
					initialDelayMs: 10,
					maxDelayMs: 100,
				}),
			);

			const result = await lastValueFrom(source$);

			expect(result).toBe('success');
			expect(attempts).toBe(3);
			expect(mockLogger.warn).toHaveBeenCalledTimes(2);
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it('should fail after max retries', async () => {
			const error = new Error('ECONNRESET');
			error.code = 'ECONNRESET';

			const source$ = throwError(() => error).pipe(
				ContractRetryUtil.createRetryOperator('test operation', {
					maxRetries: 2,
					initialDelayMs: 10,
					maxDelayMs: 100,
				}),
			);

			await expect(lastValueFrom(source$)).rejects.toThrow(error);
			expect(mockLogger.warn).toHaveBeenCalledTimes(1);
			expect(mockLogger.error).toHaveBeenCalledTimes(1);
		});

		it('should not retry on non-retryable error', async () => {
			const error = new Error('Business logic error');

			const source$ = throwError(() => error).pipe(ContractRetryUtil.createRetryOperator('test operation'));

			await expect(lastValueFrom(source$)).rejects.toThrow(error);
			expect(mockLogger.warn).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalledTimes(1);
		});
	});
});

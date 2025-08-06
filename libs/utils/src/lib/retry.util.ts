import { Observable, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

export interface RetryOptions {
	backoffMultiplier?: number;
	delayFn?: (ms: number) => Promise<void>;
	logger?: Logger;
	maxRetries?: number;
	retryDelay?: number;
}

export async function retryOperation<T>(
	operation: () => Promise<T>,
	description: string,
	options: RetryOptions = {},
): Promise<T> {
	const logger = options.logger ?? new Logger('RetryUtil');
	const maxRetries = options.maxRetries ?? 3;
	const retryDelay = options.retryDelay ?? 1000;
	const backoffMultiplier = options.backoffMultiplier ?? 2;
	const delayFn = options.delayFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

	let lastError: any;

	for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
		try {
			logger.log(`${description} (attempt ${attempt})`);
			return await operation();
		} catch (error) {
			lastError = error;
			logger.warn(`${description} failed (attempt ${attempt}):`, error);

			if (attempt <= maxRetries) {
				const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
				logger.log(`${description} retrying in ${delay}ms (attempt ${attempt})`);
				await delayFn(delay);
			}
		}
	}

	throw lastError;
}

/**
 * Wraps an Observable with retry logic using the same configuration as retryOperation
 */
export function retryObservable<T>(
	observable: Observable<T>,
	description: string,
	options: RetryOptions = {},
): Observable<T> {
	const logger = options.logger ?? new Logger('RetryUtil');
	const maxRetries = options.maxRetries ?? 3;
	const retryDelay = options.retryDelay ?? 1000;
	const backoffMultiplier = options.backoffMultiplier ?? 2;

	let attemptCount = 0;

	return observable.pipe(
		retry({
			count: maxRetries,
			delay: (error, retryCount) => {
				attemptCount = retryCount;
				logger.warn(`${description} failed (attempt ${attemptCount}):`, error);

				const delay = retryDelay * Math.pow(backoffMultiplier, attemptCount - 1);
				logger.log(`${description} retrying in ${delay}ms (attempt ${attemptCount})`);

				return timer(delay);
			},
		}),
	);
}

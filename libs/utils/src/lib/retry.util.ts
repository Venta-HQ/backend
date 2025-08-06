import retry from 'retry';
import { Logger } from '@nestjs/common';
import { Observable, from, timer } from 'rxjs';
import { retryWhen, mergeMap } from 'rxjs/operators';

export interface RetryOptions {
	backoffMultiplier?: number;
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

	const operation_retry = retry.operation({
		factor: backoffMultiplier,
		maxTimeout: retryDelay * Math.pow(backoffMultiplier, maxRetries),
		minTimeout: retryDelay,
		retries: maxRetries,
	});

	return new Promise((resolve, reject) => {
		operation_retry.attempt(async (currentAttempt: number) => {
			try {
				logger.log(`${description} (attempt ${currentAttempt})`);
				const result = await operation();
				resolve(result);
			} catch (error) {
				logger.warn(`${description} failed (attempt ${currentAttempt}):`, error);
				if (operation_retry.retry(error as Error)) {
					return;
				}
				reject(operation_retry.mainError());
			}
		});
	});
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
		retryWhen((errors) =>
			errors.pipe(
				mergeMap((error) => {
					attemptCount++;
					logger.warn(`${description} failed (attempt ${attemptCount}):`, error);
					
					if (attemptCount > maxRetries) {
						throw error; // Stop retrying
					}
					
					const delay = retryDelay * Math.pow(backoffMultiplier, attemptCount - 1);
					logger.log(`${description} retrying in ${delay}ms (attempt ${attemptCount})`);
					
					return timer(delay);
				})
			)
		)
	);
}

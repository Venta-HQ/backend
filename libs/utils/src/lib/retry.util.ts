import retry from 'retry';
import { Logger } from '@nestjs/common';

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
		retries: maxRetries,
		factor: backoffMultiplier,
		minTimeout: retryDelay,
		maxTimeout: retryDelay * Math.pow(backoffMultiplier, maxRetries),
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

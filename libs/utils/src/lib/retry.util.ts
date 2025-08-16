import { Observable, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { Logger } from '@venta/nest/modules';

export interface RetryOptions {
	backoffMultiplier?: number;
	delayFn?: (ms: number) => Promise<void>;
	jitter?: boolean;
	logger?: Logger;
	maxRetries?: number;
	maxTimeout?: number;
	retryCondition?: (error: any) => boolean;
	retryDelay?: number;
}
/**
 * gRPC codes considered transient and safe to retry
 * DEADLINE_EXCEEDED(4), RESOURCE_EXHAUSTED(8), UNAVAILABLE(14)
 */
export function shouldRetryGrpcCode(code: number | undefined): boolean {
	return code === 4 || code === 8 || code === 14;
}

/**
 * Calculate delay with optional jitter to prevent thundering herd
 */
function calculateDelay(
	baseDelay: number,
	attempt: number,
	backoffMultiplier: number,
	maxTimeout: number,
	jitter: boolean,
): number {
	const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxTimeout);

	if (jitter) {
		// Add ±25% jitter
		const jitterAmount = delay * 0.25;
		return delay + Math.random() * jitterAmount * 2 - jitterAmount;
	}

	return delay;
}

export async function retryOperation<T>(
	operation: () => Promise<T>,
	description: string,
	options: RetryOptions = {},
): Promise<T> {
	const logger = options.logger ?? new Logger().setContext('RetryUtil');
	const maxRetries = options.maxRetries ?? 3;
	const retryDelay = options.retryDelay ?? 1000;
	const backoffMultiplier = options.backoffMultiplier ?? 2;
	const maxTimeout = options.maxTimeout ?? retryDelay * Math.pow(backoffMultiplier, maxRetries);
	const retryCondition = options.retryCondition ?? (() => true);
	const jitter = options.jitter ?? true;
	const delayFn = options.delayFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

	let lastError: any;

	for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
		try {
			logger.log(`${description} (attempt ${attempt})`);
			return await operation();
		} catch (error) {
			lastError = error;
			logger.warn(`${description} failed (attempt ${attempt}):`, error);

			// Check if we should retry this error
			if (attempt <= maxRetries && retryCondition(error)) {
				const delay = calculateDelay(retryDelay, attempt, backoffMultiplier, maxTimeout, jitter);
				logger.log(`${description} retrying in ${Math.round(delay)}ms (attempt ${attempt})`);
				await delayFn(delay);
			} else {
				// Don't retry - either max retries reached or error doesn't match condition
				break;
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
	const logger = options.logger ?? new Logger().setContext('RetryUtil');
	const maxRetries = options.maxRetries ?? 3;
	const retryDelay = options.retryDelay ?? 1000;
	const backoffMultiplier = options.backoffMultiplier ?? 2;
	const maxTimeout = options.maxTimeout ?? retryDelay * Math.pow(backoffMultiplier, maxRetries);
	const retryCondition = options.retryCondition ?? (() => true);
	const jitter = options.jitter ?? true;

	let attemptCount = 0;

	return observable.pipe(
		retry({
			count: maxRetries,
			delay: (error, retryCount) => {
				attemptCount = retryCount;

				// Check if we should retry this error
				if (!retryCondition(error)) {
					throw error; // Don't retry
				}

				logger.warn(`${description} failed (attempt ${attemptCount}):`, error);

				const delay = calculateDelay(retryDelay, attemptCount, backoffMultiplier, maxTimeout, jitter);
				logger.log(`${description} retrying in ${Math.round(delay)}ms (attempt ${attemptCount})`);

				return timer(delay);
			},
		}),
	);
}

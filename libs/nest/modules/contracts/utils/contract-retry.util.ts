import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

export interface RetryConfig {
	maxRetries?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
	backoffMultiplier?: number;
	retryableErrors?: string[];
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
	maxRetries: 3,
	initialDelayMs: 100,
	maxDelayMs: 5000,
	backoffMultiplier: 2,
	retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'NETWORK_ERROR', 'GRPC_UNAVAILABLE'],
};

/**
 * Utility class for handling contract-level retries and error handling
 */
export class ContractRetryUtil {
	private static readonly logger = new Logger('ContractRetryUtil');

	/**
	 * Wraps a promise-based operation with retry logic
	 */
	static async withRetry<T>(operation: () => Promise<T>, context: string, config: RetryConfig = {}): Promise<T> {
		const retryConfig = { ...DEFAULT_CONFIG, ...config };
		let attempt = 0;
		let delay = retryConfig.initialDelayMs;

		while (true) {
			try {
				return await operation();
			} catch (error) {
				attempt++;

				if (attempt >= retryConfig.maxRetries || !this.isRetryableError(error, retryConfig.retryableErrors)) {
					this.logger.error(`${context} failed after ${attempt} attempts: ${error.message}`, error.stack);
					throw error;
				}

				this.logger.warn(`${context} failed (attempt ${attempt}/${retryConfig.maxRetries}), retrying in ${delay}ms`, {
					error: error.message,
					attempt,
					delay,
				});

				await new Promise((resolve) => setTimeout(resolve, delay));
				delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
			}
		}
	}

	/**
	 * Creates a retry operator for RxJS observables
	 */
	static createRetryOperator(context: string, config: RetryConfig = {}) {
		const retryConfig = { ...DEFAULT_CONFIG, ...config };

		return retryWhen<any>((errors) =>
			errors.pipe(
				mergeMap((error, index) => {
					const attempt = index + 1;

					if (attempt >= retryConfig.maxRetries || !this.isRetryableError(error, retryConfig.retryableErrors)) {
						this.logger.error(`${context} failed after ${attempt} attempts: ${error.message}`, error.stack);
						return throwError(() => error);
					}

					const delay = Math.min(
						retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, index),
						retryConfig.maxDelayMs,
					);

					this.logger.warn(`${context} failed (attempt ${attempt}/${retryConfig.maxRetries}), retrying in ${delay}ms`, {
						error: error.message,
						attempt,
						delay,
					});

					return timer(delay);
				}),
			),
		);
	}

	/**
	 * Checks if an error is retryable based on its type or message
	 */
	private static isRetryableError(error: any, retryableErrors: string[]): boolean {
		if (!error) return false;

		// Check error code
		if (error.code && retryableErrors.includes(error.code)) {
			return true;
		}

		// Check error name
		if (error.name && retryableErrors.includes(error.name)) {
			return true;
		}

		// Check if error message contains any retryable error strings
		return retryableErrors.some((retryableError) => error.message?.toUpperCase().includes(retryableError));
	}
}

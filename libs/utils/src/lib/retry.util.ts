import { Logger } from '@nestjs/common';

export interface RetryOptions {
	backoffMultiplier?: number;
	logger?: Logger;
	maxRetries?: number;
	retryDelay?: number;
}

export class RetryUtil {
	private readonly logger: Logger;
	private readonly maxRetries: number;
	private readonly retryDelay: number;
	private readonly backoffMultiplier: number;

	constructor(options: RetryOptions = {}) {
		this.maxRetries = options.maxRetries ?? 3;
		this.retryDelay = options.retryDelay ?? 1000;
		this.backoffMultiplier = options.backoffMultiplier ?? 2;
		this.logger = options.logger ?? new Logger(RetryUtil.name);
	}

	async retryOperation<T>(operation: () => Promise<T>, description: string, retryCount = 0): Promise<T> {
		try {
			this.logger.log(description);
			return await operation();
		} catch (error) {
			if (retryCount < this.maxRetries) {
				const delay = this.retryDelay * Math.pow(this.backoffMultiplier, retryCount);
				this.logger.warn(
					`${description} failed (attempt ${retryCount + 1}/${this.maxRetries + 1}), retrying in ${delay}ms:`,
					error,
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
				return this.retryOperation(operation, description, retryCount + 1);
			} else {
				this.logger.error(`${description} failed after ${this.maxRetries + 1} attempts:`, error);
				throw error;
			}
		}
	}

	// Static method for one-off retry operations
	static async retry<T>(operation: () => Promise<T>, description: string, options: RetryOptions = {}): Promise<T> {
		const retryUtil = new RetryUtil(options);
		return retryUtil.retryOperation(operation, description);
	}
}

export interface CircuitBreakerOptions {
	/** Number of failures before opening the circuit */
	failureThreshold: number;
	/** Time in milliseconds to wait before attempting to close the circuit */
	recoveryTimeout: number;
	/** Time in milliseconds to wait before considering a call timed out */
	timeout: number;
	/** Whether to enable monitoring and logging */
	monitoring?: boolean;
}

export enum CircuitState {
	CLOSED = 'CLOSED',
	OPEN = 'OPEN',
	HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerStats {
	state: CircuitState;
	failureCount: number;
	successCount: number;
	lastFailureTime?: Date;
	lastSuccessTime?: Date;
	lastStateChangeTime: Date;
}

export class CircuitBreaker {
	private state: CircuitState = CircuitState.CLOSED;
	private failureCount = 0;
	private successCount = 0;
	private lastFailureTime?: Date;
	private lastSuccessTime?: Date;
	private lastStateChangeTime = new Date();
	private nextAttemptTime?: Date;

	constructor(
		private readonly options: CircuitBreakerOptions,
		private readonly name: string,
		private readonly logger?: { log: (message: string) => void; error: (message: string) => void },
	) {}

	/**
	 * Execute a function with circuit breaker protection
	 * @param operation The operation to execute
	 * @returns Promise with the result
	 */
	async execute<T>(operation: () => Promise<T>): Promise<T> {
		if (this.shouldAttempt()) {
			return this.attempt(operation);
		} else {
			throw new Error(`Circuit breaker '${this.name}' is OPEN`);
		}
	}

	/**
	 * Get current circuit breaker statistics
	 */
	getStats(): CircuitBreakerStats {
		return {
			state: this.state,
			failureCount: this.failureCount,
			successCount: this.successCount,
			lastFailureTime: this.lastFailureTime,
			lastSuccessTime: this.lastSuccessTime,
			lastStateChangeTime: this.lastStateChangeTime,
		};
	}

	/**
	 * Reset the circuit breaker to CLOSED state
	 */
	reset(): void {
		this.setState(CircuitState.CLOSED);
		this.failureCount = 0;
		this.successCount = 0;
		this.lastFailureTime = undefined;
		this.lastSuccessTime = undefined;
		this.nextAttemptTime = undefined;
	}

	private shouldAttempt(): boolean {
		switch (this.state) {
			case CircuitState.CLOSED:
				return true;
			case CircuitState.OPEN:
				if (this.isRecoveryTimeoutExpired()) {
					this.setState(CircuitState.HALF_OPEN);
					return true;
				}
				return false;
			case CircuitState.HALF_OPEN:
				return true;
			default:
				return false;
		}
	}

	private isRecoveryTimeoutExpired(): boolean {
		if (!this.lastFailureTime || !this.nextAttemptTime) {
			return false;
		}
		return new Date() >= this.nextAttemptTime;
	}

	private async attempt<T>(operation: () => Promise<T>): Promise<T> {
		let timeoutId: NodeJS.Timeout;

		try {
			// Set up timeout
			const timeoutPromise = new Promise<never>((_, reject) => {
				timeoutId = setTimeout(() => {
					reject(new Error(`Operation timed out after ${this.options.timeout}ms`));
				}, this.options.timeout);
			});

			// Execute operation with timeout
			const result = await Promise.race([operation(), timeoutPromise]);

			// Clear timeout
			clearTimeout(timeoutId!);

			this.onSuccess();
			return result;
		} catch (error) {
			// Clear timeout
			if (timeoutId!) {
				clearTimeout(timeoutId);
			}

			this.onFailure(error as Error);
			throw error;
		}
	}

	private onSuccess(): void {
		this.successCount++;
		this.lastSuccessTime = new Date();

		if (this.state === CircuitState.HALF_OPEN) {
			this.setState(CircuitState.CLOSED);
			this.failureCount = 0;
		}

		if (this.options.monitoring && this.logger) {
			this.logger.log(`Circuit breaker '${this.name}' operation succeeded`);
		}
	}

	private onFailure(error: Error): void {
		this.failureCount++;
		this.lastFailureTime = new Date();

		if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
			this.setState(CircuitState.OPEN);
			this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
		} else if (this.state === CircuitState.HALF_OPEN) {
			this.setState(CircuitState.OPEN);
			this.nextAttemptTime = new Date(Date.now() + this.options.recoveryTimeout);
		}

		if (this.options.monitoring && this.logger) {
			this.logger.error(`Circuit breaker '${this.name}' operation failed: ${error.message}`);
		}
	}

	private setState(newState: CircuitState): void {
		if (this.state !== newState) {
			const oldState = this.state;
			this.state = newState;
			this.lastStateChangeTime = new Date();

			if (this.options.monitoring && this.logger) {
				this.logger.log(`Circuit breaker '${this.name}' state changed from ${oldState} to ${newState}`);
			}

			// If transitioning from OPEN to HALF_OPEN
			if (oldState === CircuitState.OPEN && newState === CircuitState.HALF_OPEN) {
				this.nextAttemptTime = undefined;
			}
		}
	}
}

/**
 * Circuit breaker manager for handling multiple circuit breakers
 */
export class CircuitBreakerManager {
	private circuitBreakers = new Map<string, CircuitBreaker>();

	/**
	 * Get or create a circuit breaker
	 * @param name Circuit breaker name
	 * @param options Circuit breaker options
	 * @param logger Optional logger
	 * @returns Circuit breaker instance
	 */
	getCircuitBreaker(
		name: string,
		options: CircuitBreakerOptions,
		logger?: { log: (message: string) => void; error: (message: string) => void },
	): CircuitBreaker {
		if (!this.circuitBreakers.has(name)) {
			this.circuitBreakers.set(name, new CircuitBreaker(options, name, logger));
		}
		return this.circuitBreakers.get(name)!;
	}

	/**
	 * Get all circuit breaker statistics
	 */
	getAllStats(): Record<string, CircuitBreakerStats> {
		const stats: Record<string, CircuitBreakerStats> = {};
		for (const [name, circuitBreaker] of this.circuitBreakers) {
			stats[name] = circuitBreaker.getStats();
		}
		return stats;
	}

	/**
	 * Reset all circuit breakers
	 */
	resetAll(): void {
		for (const circuitBreaker of this.circuitBreakers.values()) {
			circuitBreaker.reset();
		}
	}
}

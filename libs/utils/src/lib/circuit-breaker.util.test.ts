import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CircuitBreaker, CircuitBreakerManager, CircuitState } from './circuit-breaker.util';

describe('CircuitBreaker', () => {
	const mockLogger = {
		log: vi.fn(),
		error: vi.fn(),
	};

	const defaultOptions = {
		failureThreshold: 3,
		recoveryTimeout: 1000,
		timeout: 500,
		monitoring: true,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('basic functionality', () => {
		it('should execute successful operations when closed', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockResolvedValue('success');

			const result = await circuitBreaker.execute(operation);

			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
			expect(circuitBreaker.getStats().state).toBe(CircuitState.CLOSED);
		});

		it('should handle failed operations', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			expect(operation).toHaveBeenCalledTimes(1);
			expect(circuitBreaker.getStats().failureCount).toBe(1);
		});

		it('should open circuit after failure threshold is reached', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Fail 3 times (failure threshold)
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			}

			expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);
			expect(circuitBreaker.getStats().failureCount).toBe(3);
		});

		it('should reject operations when circuit is open', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			}

			// Try to execute when circuit is open
			await expect(circuitBreaker.execute(operation)).rejects.toThrow("Circuit breaker 'test' is OPEN");
			expect(operation).toHaveBeenCalledTimes(3); // Should not call the operation again
		});
	});

	describe('recovery behavior', () => {
		it('should transition to half-open after recovery timeout', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			}

			expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);

			// Advance time past recovery timeout
			vi.advanceTimersByTime(1001);

			// Check that we can attempt (which means we're in half-open state)
			// We need to check the internal state before the operation fails
			const shouldAttempt = (circuitBreaker as any).shouldAttempt();
			expect(shouldAttempt).toBe(true);

			// Try to execute to trigger state transition
			await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');

			// After the operation fails, it should be back to OPEN
			expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);
		});

		it('should close circuit on successful operation in half-open state', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
			const successfulOperation = vi.fn().mockResolvedValue('success');

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Operation failed');
			}

			// Advance time past recovery timeout
			vi.advanceTimersByTime(1001);

			// Execute successful operation in half-open state
			const result = await circuitBreaker.execute(successfulOperation);

			expect(result).toBe('success');
			expect(circuitBreaker.getStats().state).toBe(CircuitState.CLOSED);
			expect(circuitBreaker.getStats().failureCount).toBe(0);
		});

		it('should open circuit again on failed operation in half-open state', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			}

			// Advance time past recovery timeout
			vi.advanceTimersByTime(1001);

			// Fail again in half-open state
			await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');

			expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);
		});
	});

	describe('timeout handling', () => {
		it('should timeout operations that take too long', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const slowOperation = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

			const promise = circuitBreaker.execute(slowOperation);

			// Advance timers to trigger timeout
			vi.advanceTimersByTime(501);

			await expect(promise).rejects.toThrow('Operation timed out after 500ms');
			expect(circuitBreaker.getStats().failureCount).toBe(1);
		});
	});

	describe('statistics', () => {
		it('should track success and failure statistics', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const successfulOperation = vi.fn().mockResolvedValue('success');
			const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Execute some successful operations
			await circuitBreaker.execute(successfulOperation);
			await circuitBreaker.execute(successfulOperation);

			// Execute some failing operations
			await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Operation failed');
			await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Operation failed');

			const stats = circuitBreaker.getStats();
			expect(stats.successCount).toBe(2);
			expect(stats.failureCount).toBe(2);
			expect(stats.lastSuccessTime).toBeInstanceOf(Date);
			expect(stats.lastFailureTime).toBeInstanceOf(Date);
		});
	});

	describe('reset functionality', () => {
		it('should reset circuit breaker to closed state', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			}

			expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);

			// Reset the circuit breaker
			circuitBreaker.reset();

			const stats = circuitBreaker.getStats();
			expect(stats.state).toBe(CircuitState.CLOSED);
			expect(stats.failureCount).toBe(0);
			expect(stats.successCount).toBe(0);
		});
	});

	describe('logging', () => {
		it('should log state changes when monitoring is enabled', async () => {
			const circuitBreaker = new CircuitBreaker(defaultOptions, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			}

			expect(mockLogger.log).toHaveBeenCalledWith("Circuit breaker 'test' state changed from CLOSED to OPEN");
			expect(mockLogger.error).toHaveBeenCalledWith("Circuit breaker 'test' operation failed: Operation failed");
		});

		it('should not log when monitoring is disabled', async () => {
			const circuitBreaker = new CircuitBreaker({ ...defaultOptions, monitoring: false }, 'test', mockLogger);
			const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

			// Open the circuit
			for (let i = 0; i < 3; i++) {
				await expect(circuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
			}

			expect(mockLogger.log).not.toHaveBeenCalled();
			expect(mockLogger.error).not.toHaveBeenCalled();
		});
	});
});

describe('CircuitBreakerManager', () => {
	const mockLogger = {
		log: vi.fn(),
		error: vi.fn(),
	};

	const defaultOptions = {
		failureThreshold: 3,
		recoveryTimeout: 1000,
		timeout: 500,
		monitoring: true,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create and manage multiple circuit breakers', () => {
		const manager = new CircuitBreakerManager();

		const cb1 = manager.getCircuitBreaker('service1', defaultOptions, mockLogger);
		const cb2 = manager.getCircuitBreaker('service2', defaultOptions, mockLogger);

		expect(cb1).toBeInstanceOf(CircuitBreaker);
		expect(cb2).toBeInstanceOf(CircuitBreaker);
		expect(cb1).not.toBe(cb2);
	});

	it('should return the same circuit breaker instance for the same name', () => {
		const manager = new CircuitBreakerManager();

		const cb1 = manager.getCircuitBreaker('service1', defaultOptions, mockLogger);
		const cb2 = manager.getCircuitBreaker('service1', defaultOptions, mockLogger);

		expect(cb1).toBe(cb2);
	});

	it('should provide statistics for all circuit breakers', async () => {
		const manager = new CircuitBreakerManager();

		const cb1 = manager.getCircuitBreaker('service1', defaultOptions, mockLogger);
		const cb2 = manager.getCircuitBreaker('service2', defaultOptions, mockLogger);

		// Execute some operations
		const operation = vi.fn().mockResolvedValue('success');
		await cb1.execute(operation);

		const stats = manager.getAllStats();
		expect(stats).toHaveProperty('service1');
		expect(stats).toHaveProperty('service2');
		expect(stats.service1.successCount).toBe(1);
		expect(stats.service2.successCount).toBe(0);
	});

	it('should reset all circuit breakers', async () => {
		const manager = new CircuitBreakerManager();

		const cb1 = manager.getCircuitBreaker('service1', defaultOptions, mockLogger);
		const cb2 = manager.getCircuitBreaker('service2', defaultOptions, mockLogger);

		// Execute some operations
		const operation = vi.fn().mockResolvedValue('success');
		await cb1.execute(operation);
		await cb2.execute(operation);

		// Reset all
		manager.resetAll();

		const stats = manager.getAllStats();
		expect(stats.service1.successCount).toBe(0);
		expect(stats.service2.successCount).toBe(0);
	});
});

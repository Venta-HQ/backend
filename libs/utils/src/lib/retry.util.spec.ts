import { defer, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryObservable, retryOperation, shouldRetryGrpcCode } from './retry.util';

describe('retry.util', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('shouldRetryGrpcCode', () => {
		expect(shouldRetryGrpcCode(4)).toBe(true);
		expect(shouldRetryGrpcCode(8)).toBe(true);
		expect(shouldRetryGrpcCode(14)).toBe(true);
		expect(shouldRetryGrpcCode(1)).toBe(false);
	});

	it('retryOperation succeeds after retries', async () => {
		let attempts = 0;
		const op = async () => {
			attempts++;
			if (attempts < 2) throw new Error('fail');
			return 'ok';
		};
		const promise = retryOperation(op, 'test', {
			maxRetries: 3,
			retryDelay: 100,
			jitter: false,
			delayFn: async () => {},
		});
		await expect(promise).resolves.toBe('ok');
	});

	it('retryObservable retries and completes', async () => {
		let attempts = 0;
		const source$ = defer(() => (attempts++ < 1 ? throwError(() => new Error('fail')) : of(42)));

		const result: number[] = [];
		await new Promise<void>((resolve) => {
			retryObservable(source$, 'test', { maxRetries: 3, retryDelay: 10, jitter: false }).subscribe({
				next: (v) => result.push(v as number),
				complete: () => resolve(),
			});
			vi.advanceTimersByTime(100);
		});
		expect(result).toEqual([42]);
	});
});

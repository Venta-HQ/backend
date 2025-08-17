import { describe, expect, it } from 'vitest';
import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
	it('stores and retrieves values per run context', () => {
		const rcs = new RequestContextService();
		let valueInA: string | undefined;
		let valueInB: string | undefined;

		rcs.run(() => {
			rcs.set('requestId', 'A');
			valueInA = rcs.getRequestId();
		});

		rcs.run(() => {
			rcs.set('requestId', 'B');
			valueInB = rcs.getRequestId();
		});

		expect(valueInA).toBe('A');
		expect(valueInB).toBe('B');
	});
});

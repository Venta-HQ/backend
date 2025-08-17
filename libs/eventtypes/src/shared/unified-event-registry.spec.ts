import { describe, expect, it } from 'vitest';
import { getEventsForDomain } from './unified-event-registry';

describe('unified event registry helpers', () => {
	it('returns marketplace events including vendor subjects', () => {
		const evts = getEventsForDomain('marketplace');
		expect(evts.some((s) => s.startsWith('marketplace.vendor.'))).toBe(true);
	});
});

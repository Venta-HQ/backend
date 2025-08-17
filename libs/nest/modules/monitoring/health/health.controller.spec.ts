import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
	it('returns health check result', async () => {
		const health = { check: vi.fn().mockResolvedValue({ status: 'ok' }) } as any;
		const ctrl = new HealthController(health, {} as any, {} as any, {} as any, { appName: 'app' } as any);
		const res = await ctrl.getHealth();
		expect(res).toEqual({ status: 'ok' });
	});
});

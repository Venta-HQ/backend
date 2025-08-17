import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { PrometheusService } from './prometheus.service';

describe('PrometheusService', () => {
	let svc: PrometheusService;
	beforeEach(() => {
		svc = new PrometheusService({ get: vi.fn() } as unknown as ConfigService, { setContext: vi.fn() } as any);
	});

	it('registers and fetches metrics', async () => {
		const metrics = svc.registerMetrics([
			{ type: 'counter', name: 'c1', help: 'counter', labelNames: [] },
			{ type: 'gauge', name: 'g1', help: 'gauge', labelNames: [] },
			{ type: 'histogram', name: 'h1', help: 'hist', buckets: [0.1, 1, 2], labelNames: [] },
		]);
		expect(svc.hasMetric('c1')).toBe(true);
		expect(metrics.c1).toBeDefined();
		expect(svc.getMetricCount()).toBe(3);
	});
});

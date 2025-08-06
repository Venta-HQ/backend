import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrometheusService } from './prometheus.service';

// Mock prom-client to avoid initialization issues in tests
vi.mock('prom-client', () => ({
	Counter: vi.fn().mockImplementation((config) => ({
		inc: vi.fn(),
		...config,
	})),
	Gauge: vi.fn().mockImplementation((config) => ({
		dec: vi.fn(),
		inc: vi.fn(),
		set: vi.fn(),
		...config,
	})),
	Histogram: vi.fn().mockImplementation((config) => ({
		observe: vi.fn(),
		...config,
	})),
	Registry: vi.fn().mockImplementation(() => ({
		clear: vi.fn().mockResolvedValue(undefined),
		metrics: vi.fn().mockResolvedValue('# HELP test_counter Test counter\n# TYPE test_counter counter\ntest_counter 0'),
	})),
}));

describe('PrometheusService', () => {
	let service: PrometheusService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [PrometheusService],
		}).compile();

		service = module.get<PrometheusService>(PrometheusService);
	});

	afterEach(async () => {
		// Clean up after each test
		if (service) {
			await service.resetMetrics();
		}
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('registerMetrics', () => {
		it('should register counter metrics', () => {
			const metrics = service.registerMetrics([
				{
					help: 'Test counter',
					labelNames: ['label1', 'label2'],
					name: 'test_counter',
					type: 'counter',
				},
			]);

			expect(metrics.test_counter).toBeDefined();
			expect(service.hasMetric('test_counter')).toBe(true);
		});

		it('should register gauge metrics', () => {
			const metrics = service.registerMetrics([
				{
					help: 'Test gauge',
					labelNames: ['label1'],
					name: 'test_gauge',
					type: 'gauge',
				},
			]);

			expect(metrics.test_gauge).toBeDefined();
			expect(service.hasMetric('test_gauge')).toBe(true);
		});

		it('should register histogram metrics', () => {
			const metrics = service.registerMetrics([
				{
					buckets: [0.1, 0.5, 1, 2, 5],
					help: 'Test histogram',
					labelNames: ['label1'],
					name: 'test_histogram',
					type: 'histogram',
				},
			]);

			expect(metrics.test_histogram).toBeDefined();
			expect(service.hasMetric('test_histogram')).toBe(true);
		});

		it('should throw error for duplicate metric names', () => {
			service.registerMetrics([
				{
					help: 'First metric',
					name: 'duplicate_metric',
					type: 'counter',
				},
			]);

			expect(() => {
				service.registerMetrics([
					{
						help: 'Second metric',
						name: 'duplicate_metric',
						type: 'counter',
					},
				]);
			}).toThrow('Metric duplicate_metric is already registered');
		});

		it('should throw error for unknown metric type', () => {
			expect(() => {
				service.registerMetrics([
					{
						help: 'Test metric',
						name: 'test_metric',
						type: 'unknown' as any,
					},
				]);
			}).toThrow('Unknown metric type: unknown');
		});
	});

	describe('getMetric', () => {
		it('should return registered metric', () => {
			service.registerMetrics([
				{
					help: 'Test metric',
					name: 'test_metric',
					type: 'counter',
				},
			]);

			const metric = service.getMetric('test_metric');
			expect(metric).toBeDefined();
		});

		it('should return undefined for non-existent metric', () => {
			const metric = service.getMetric('non_existent');
			expect(metric).toBeUndefined();
		});
	});

	describe('getAllMetrics', () => {
		it('should return all registered metrics', () => {
			service.registerMetrics([
				{
					help: 'Metric 1',
					name: 'metric1',
					type: 'counter',
				},
				{
					help: 'Metric 2',
					name: 'metric2',
					type: 'gauge',
				},
			]);

			const allMetrics = service.getAllMetrics();
			expect(allMetrics.metric1).toBeDefined();
			expect(allMetrics.metric2).toBeDefined();
			expect(Object.keys(allMetrics)).toHaveLength(2);
		});
	});

	describe('getMetrics', () => {
		it('should return metrics in Prometheus format', async () => {
			service.registerMetrics([
				{
					help: 'Test counter',
					name: 'test_counter',
					type: 'counter',
				},
			]);

			const metrics = await service.getMetrics();
			expect(metrics).toContain('# HELP test_counter Test counter');
			expect(metrics).toContain('# TYPE test_counter counter');
			expect(metrics).toContain('test_counter 0');
		});
	});

	describe('resetMetrics', () => {
		it('should clear all registered metrics', async () => {
			service.registerMetrics([
				{
					help: 'Test metric',
					name: 'test_metric',
					type: 'counter',
				},
			]);

			expect(service.getMetricCount()).toBe(1);

			await service.resetMetrics();

			expect(service.getMetricCount()).toBe(0);
			expect(service.getMetric('test_metric')).toBeUndefined();
		});
	});

	describe('hasMetric', () => {
		it('should return true for existing metric', () => {
			service.registerMetrics([
				{
					help: 'Test metric',
					name: 'test_metric',
					type: 'counter',
				},
			]);

			expect(service.hasMetric('test_metric')).toBe(true);
		});

		it('should return false for non-existing metric', () => {
			expect(service.hasMetric('non_existent')).toBe(false);
		});
	});

	describe('getMetricCount', () => {
		it('should return correct count of registered metrics', () => {
			expect(service.getMetricCount()).toBe(0);

			service.registerMetrics([
				{
					help: 'Metric 1',
					name: 'metric1',
					type: 'counter',
				},
				{
					help: 'Metric 2',
					name: 'metric2',
					type: 'gauge',
				},
			]);

			expect(service.getMetricCount()).toBe(2);
		});
	});

	describe('application metrics', () => {
		it('should have application uptime metric', () => {
			expect(service.application.uptime).toBeDefined();
		});

		it('should have application version metric', () => {
			expect(service.application.version).toBeDefined();
		});

		it('should have application memory usage metric', () => {
			expect(service.application.memoryUsage).toBeDefined();
		});
	});
});

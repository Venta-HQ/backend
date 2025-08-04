import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

export interface MetricDefinition {
	name: string;
	help: string;
	labelNames?: string[];
	buckets?: number[];
}

export interface CounterDefinition extends MetricDefinition {
	type: 'counter';
}

export interface GaugeDefinition extends MetricDefinition {
	type: 'gauge';
}

export interface HistogramDefinition extends MetricDefinition {
	type: 'histogram';
	buckets: number[];
}

export type MetricConfig = CounterDefinition | GaugeDefinition | HistogramDefinition;

export interface PrometheusMetrics {
	[key: string]: Counter<string> | Gauge<string> | Histogram<string>;
}

@Injectable()
export class PrometheusService implements OnModuleInit {
	private readonly registry = new Registry();
	private readonly metrics: Map<string, Counter<string> | Gauge<string> | Histogram<string>> = new Map();

	// Application metrics (common across all apps)
	public readonly application = {
		uptime: new Gauge({
			name: 'application_uptime_seconds',
			help: 'Application uptime in seconds',
			registers: [this.registry],
		}),
		version: new Gauge({
			name: 'application_version_info',
			help: 'Application version information',
			labelNames: ['version', 'commit', 'environment'],
			registers: [this.registry],
		}),
		memoryUsage: new Gauge({
			name: 'application_memory_usage_bytes',
			help: 'Application memory usage in bytes',
			labelNames: ['type'], // heap, rss, external
			registers: [this.registry],
		}),
	};

	onModuleInit() {
		// Set initial application version
		this.application.version.set(
			{
				version: process.env.npm_package_version || 'unknown',
				commit: process.env.GIT_COMMIT || 'unknown',
				environment: process.env.NODE_ENV || 'development',
			},
			1,
		);

		// Start uptime tracking
		this.startUptimeTracking();
		this.startMemoryTracking();
	}

	/**
	 * Register custom metrics for the application
	 */
	registerMetrics(metrics: MetricConfig[]): PrometheusMetrics {
		const registeredMetrics: PrometheusMetrics = {};

		for (const metric of metrics) {
			if (this.metrics.has(metric.name)) {
				throw new Error(`Metric ${metric.name} is already registered`);
			}

			let prometheusMetric: Counter<string> | Gauge<string> | Histogram<string>;

			switch (metric.type) {
				case 'counter':
					prometheusMetric = new Counter({
						name: metric.name,
						help: metric.help,
						labelNames: metric.labelNames,
						registers: [this.registry],
					});
					break;

				case 'gauge':
					prometheusMetric = new Gauge({
						name: metric.name,
						help: metric.help,
						labelNames: metric.labelNames,
						registers: [this.registry],
					});
					break;

				case 'histogram':
					prometheusMetric = new Histogram({
						name: metric.name,
						help: metric.help,
						labelNames: metric.labelNames,
						buckets: metric.buckets,
						registers: [this.registry],
					});
					break;

				default:
					throw new Error(`Unknown metric type: ${(metric as any).type}`);
			}

			this.metrics.set(metric.name, prometheusMetric);
			registeredMetrics[metric.name] = prometheusMetric;
		}

		return registeredMetrics;
	}

	/**
	 * Get a registered metric by name
	 */
	getMetric(name: string): Counter<string> | Gauge<string> | Histogram<string> | undefined {
		return this.metrics.get(name);
	}

	/**
	 * Get all registered metrics
	 */
	getAllMetrics(): PrometheusMetrics {
		const result: PrometheusMetrics = {};
		for (const [name, metric] of this.metrics.entries()) {
			result[name] = metric;
		}
		return result;
	}

	/**
	 * Get metrics in Prometheus format
	 */
	async getMetrics(): Promise<string> {
		return await this.registry.metrics();
	}

	/**
	 * Reset all metrics (useful for testing)
	 */
	async resetMetrics(): Promise<void> {
		await this.registry.clear();
		this.metrics.clear();
	}

	/**
	 * Check if a metric is registered
	 */
	hasMetric(name: string): boolean {
		return this.metrics.has(name);
	}

	/**
	 * Get the number of registered metrics
	 */
	getMetricCount(): number {
		return this.metrics.size;
	}

	private startUptimeTracking(): void {
		const startTime = Date.now();
		setInterval(() => {
			const uptime = (Date.now() - startTime) / 1000;
			this.application.uptime.set(uptime);
		}, 1000);
	}

	private startMemoryTracking(): void {
		setInterval(() => {
			const memUsage = process.memoryUsage();
			this.application.memoryUsage.set({ type: 'heap' }, memUsage.heapUsed);
			this.application.memoryUsage.set({ type: 'rss' }, memUsage.rss);
			this.application.memoryUsage.set({ type: 'external' }, memUsage.external);
		}, 5000);
	}
} 
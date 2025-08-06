import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MetricDefinition {
	buckets?: number[];
	help: string;
	labelNames?: string[];
	name: string;
}

export interface CounterDefinition extends MetricDefinition {
	type: 'counter';
}

export interface GaugeDefinition extends MetricDefinition {
	type: 'gauge';
}

export interface HistogramDefinition extends MetricDefinition {
	buckets: number[];
	type: 'histogram';
}

export type MetricConfig = CounterDefinition | GaugeDefinition | HistogramDefinition;

export interface PrometheusMetrics {
	[key: string]: Counter<string> | Gauge<string> | Histogram<string>;
}

@Injectable()
export class PrometheusService implements OnModuleInit {
	private readonly registry = new Registry();
	private readonly metrics: Map<string, Counter<string> | Gauge<string> | Histogram<string>> = new Map();
	private readonly logger = new Logger(PrometheusService.name);

	public readonly application = {
		memoryUsage: new Gauge({
			help: 'Application memory usage in bytes',
			labelNames: ['type'], // heap, rss, external
			name: 'application_memory_usage_bytes',
			registers: [this.registry],
		}),
		uptime: new Gauge({
			help: 'Application uptime in seconds',
			labelNames: ['version', 'commit', 'environment'],
			name: 'application_uptime_seconds',
			registers: [this.registry],
		}),
		version: new Gauge({
			help: 'Application version information',
			labelNames: ['version', 'commit', 'environment'],
			name: 'application_version_info',
			registers: [this.registry],
		}),
	};

	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		// Set initial application version
		this.application.version.set(
			{
				commit: this.configService.get('GIT_COMMIT') || 'unknown',
				environment: this.configService.get('NODE_ENV') || 'development',
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
						help: metric.help,
						labelNames: metric.labelNames,
						name: metric.name,
						registers: [this.registry],
					});
					break;

				case 'gauge':
					prometheusMetric = new Gauge({
						help: metric.help,
						labelNames: metric.labelNames,
						name: metric.name,
						registers: [this.registry],
					});
					break;

				case 'histogram':
					prometheusMetric = new Histogram({
						buckets: metric.buckets,
						help: metric.help,
						labelNames: metric.labelNames,
						name: metric.name,
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

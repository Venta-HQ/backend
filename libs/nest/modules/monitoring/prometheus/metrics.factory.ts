import { MetricConfig } from './prometheus.service';

export class MetricsFactory {
	/**
	 * Create WebSocket metrics configuration
	 */
	static websocketMetrics(prefix: string = 'websocket'): MetricConfig[] {
		return [
			{
				help: 'Total number of websocket connections',
				labelNames: ['type', 'status'],
				name: `${prefix}_connections_total`,
				type: 'counter',
			},
			{
				help: 'Number of currently active websocket connections',
				labelNames: ['type'],
				name: `${prefix}_connections_active`,
				type: 'gauge',
			},
			{
				buckets: [1, 5, 15, 30, 60, 300, 600, 1800, 3600], // 1s to 1h
				help: 'Duration of websocket connections',
				labelNames: ['type'],
				name: `${prefix}_connection_duration_seconds`,
				type: 'histogram',
			},
			{
				help: 'Total number of websocket errors',
				labelNames: ['type', 'error_code'],
				name: `${prefix}_errors_total`,
				type: 'counter',
			},
			{
				help: 'Total number of websocket disconnections',
				labelNames: ['type', 'reason'],
				name: `${prefix}_disconnections_total`,
				type: 'counter',
			},
		];
	}

	/**
	 * Create HTTP metrics configuration
	 */
	static httpMetrics(prefix: string = 'http'): MetricConfig[] {
		return [
			{
				help: 'Total number of HTTP requests',
				labelNames: ['method', 'path', 'status_code'],
				name: `${prefix}_requests_total`,
				type: 'counter',
			},
			{
				buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
				help: 'Duration of HTTP requests',
				labelNames: ['method', 'path'],
				name: `${prefix}_request_duration_seconds`,
				type: 'histogram',
			},
			{
				help: 'Number of HTTP requests currently in progress',
				labelNames: ['method'],
				name: `${prefix}_requests_in_progress`,
				type: 'gauge',
			},
		];
	}

	/**
	 * Create database metrics configuration
	 */
	static databaseMetrics(prefix: string = 'database'): MetricConfig[] {
		return [
			{
				help: 'Total number of database queries',
				labelNames: ['operation', 'table'],
				name: `${prefix}_queries_total`,
				type: 'counter',
			},
			{
				buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
				help: 'Duration of database queries',
				labelNames: ['operation', 'table'],
				name: `${prefix}_query_duration_seconds`,
				type: 'histogram',
			},
			{
				help: 'Number of active database connections',
				name: `${prefix}_connections_active`,
				type: 'gauge',
			},
		];
	}

	/**
	 * Create gRPC metrics configuration
	 */
	static grpcMetrics(prefix: string = 'grpc'): MetricConfig[] {
		return [
			{
				help: 'Total number of gRPC requests',
				labelNames: ['service', 'method', 'status'],
				name: `${prefix}_requests_total`,
				type: 'counter',
			},
			{
				buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
				help: 'Duration of gRPC requests',
				labelNames: ['service', 'method'],
				name: `${prefix}_request_duration_seconds`,
				type: 'histogram',
			},
			{
				help: 'Number of gRPC requests currently in progress',
				labelNames: ['service'],
				name: `${prefix}_requests_in_progress`,
				type: 'gauge',
			},
		];
	}

	/**
	 * Create custom counter metric
	 */
	static counter(name: string, help: string, labelNames?: string[]): MetricConfig {
		return {
			help,
			labelNames,
			name,
			type: 'counter',
		};
	}

	/**
	 * Create custom gauge metric
	 */
	static gauge(name: string, help: string, labelNames?: string[]): MetricConfig {
		return {
			help,
			labelNames,
			name,
			type: 'gauge',
		};
	}

	/**
	 * Create custom histogram metric
	 */
	static histogram(name: string, help: string, buckets: number[], labelNames?: string[]): MetricConfig {
		return {
			buckets,
			help,
			labelNames,
			name,
			type: 'histogram',
		};
	}
}

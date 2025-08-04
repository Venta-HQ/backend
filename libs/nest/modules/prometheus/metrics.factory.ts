import { MetricConfig } from './prometheus.service';

export class MetricsFactory {
	/**
	 * Create WebSocket metrics configuration
	 */
	static websocketMetrics(prefix: string = 'websocket'): MetricConfig[] {
		return [
			{
				type: 'counter',
				name: `${prefix}_connections_total`,
				help: 'Total number of websocket connections',
				labelNames: ['type', 'status'],
			},
			{
				type: 'gauge',
				name: `${prefix}_connections_active`,
				help: 'Number of currently active websocket connections',
				labelNames: ['type'],
			},
			{
				type: 'histogram',
				name: `${prefix}_connection_duration_seconds`,
				help: 'Duration of websocket connections',
				labelNames: ['type'],
				buckets: [1, 5, 15, 30, 60, 300, 600, 1800, 3600], // 1s to 1h
			},
			{
				type: 'counter',
				name: `${prefix}_errors_total`,
				help: 'Total number of websocket errors',
				labelNames: ['type', 'error_code'],
			},
			{
				type: 'counter',
				name: `${prefix}_disconnections_total`,
				help: 'Total number of websocket disconnections',
				labelNames: ['type', 'reason'],
			},
		];
	}

	/**
	 * Create HTTP metrics configuration
	 */
	static httpMetrics(prefix: string = 'http'): MetricConfig[] {
		return [
			{
				type: 'counter',
				name: `${prefix}_requests_total`,
				help: 'Total number of HTTP requests',
				labelNames: ['method', 'path', 'status_code'],
			},
			{
				type: 'histogram',
				name: `${prefix}_request_duration_seconds`,
				help: 'Duration of HTTP requests',
				labelNames: ['method', 'path'],
				buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
			},
			{
				type: 'gauge',
				name: `${prefix}_requests_in_progress`,
				help: 'Number of HTTP requests currently in progress',
				labelNames: ['method'],
			},
		];
	}

	/**
	 * Create database metrics configuration
	 */
	static databaseMetrics(prefix: string = 'database'): MetricConfig[] {
		return [
			{
				type: 'counter',
				name: `${prefix}_queries_total`,
				help: 'Total number of database queries',
				labelNames: ['operation', 'table'],
			},
			{
				type: 'histogram',
				name: `${prefix}_query_duration_seconds`,
				help: 'Duration of database queries',
				labelNames: ['operation', 'table'],
				buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
			},
			{
				type: 'gauge',
				name: `${prefix}_connections_active`,
				help: 'Number of active database connections',
			},
		];
	}

	/**
	 * Create gRPC metrics configuration
	 */
	static grpcMetrics(prefix: string = 'grpc'): MetricConfig[] {
		return [
			{
				type: 'counter',
				name: `${prefix}_requests_total`,
				help: 'Total number of gRPC requests',
				labelNames: ['service', 'method', 'status'],
			},
			{
				type: 'histogram',
				name: `${prefix}_request_duration_seconds`,
				help: 'Duration of gRPC requests',
				labelNames: ['service', 'method'],
				buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
			},
			{
				type: 'gauge',
				name: `${prefix}_requests_in_progress`,
				help: 'Number of gRPC requests currently in progress',
				labelNames: ['service'],
			},
		];
	}

	/**
	 * Create custom counter metric
	 */
	static counter(name: string, help: string, labelNames?: string[]): MetricConfig {
		return {
			type: 'counter',
			name,
			help,
			labelNames,
		};
	}

	/**
	 * Create custom gauge metric
	 */
	static gauge(name: string, help: string, labelNames?: string[]): MetricConfig {
		return {
			type: 'gauge',
			name,
			help,
			labelNames,
		};
	}

	/**
	 * Create custom histogram metric
	 */
	static histogram(name: string, help: string, buckets: number[], labelNames?: string[]): MetricConfig {
		return {
			type: 'histogram',
			name,
			help,
			labelNames,
			buckets,
		};
	}
} 
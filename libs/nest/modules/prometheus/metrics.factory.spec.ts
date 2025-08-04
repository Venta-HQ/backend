import { MetricsFactory } from './metrics.factory';

describe('MetricsFactory', () => {
	describe('websocketMetrics', () => {
		it('should create websocket metrics with default prefix', () => {
			const metrics = MetricsFactory.websocketMetrics();

			expect(metrics).toHaveLength(5);
			expect(metrics[0].name).toBe('websocket_connections_total');
			expect(metrics[1].name).toBe('websocket_connections_active');
			expect(metrics[2].name).toBe('websocket_connection_duration_seconds');
			expect(metrics[3].name).toBe('websocket_errors_total');
			expect(metrics[4].name).toBe('websocket_disconnections_total');
		});

		it('should create websocket metrics with custom prefix', () => {
			const metrics = MetricsFactory.websocketMetrics('custom_prefix');

			expect(metrics).toHaveLength(5);
			expect(metrics[0].name).toBe('custom_prefix_connections_total');
			expect(metrics[1].name).toBe('custom_prefix_connections_active');
			expect(metrics[2].name).toBe('custom_prefix_connection_duration_seconds');
			expect(metrics[3].name).toBe('custom_prefix_errors_total');
			expect(metrics[4].name).toBe('custom_prefix_disconnections_total');
		});

		it('should have correct metric types', () => {
			const metrics = MetricsFactory.websocketMetrics();

			expect(metrics[0].type).toBe('counter');
			expect(metrics[1].type).toBe('gauge');
			expect(metrics[2].type).toBe('histogram');
			expect(metrics[3].type).toBe('counter');
			expect(metrics[4].type).toBe('counter');
		});

		it('should have correct label names', () => {
			const metrics = MetricsFactory.websocketMetrics();

			expect(metrics[0].labelNames).toEqual(['type', 'status']);
			expect(metrics[1].labelNames).toEqual(['type']);
			expect(metrics[2].labelNames).toEqual(['type']);
			expect(metrics[3].labelNames).toEqual(['type', 'error_code']);
			expect(metrics[4].labelNames).toEqual(['type', 'reason']);
		});

		it('should have correct buckets for histogram', () => {
			const metrics = MetricsFactory.websocketMetrics();
			const histogram = metrics.find(m => m.type === 'histogram');

			expect(histogram?.buckets).toEqual([1, 5, 15, 30, 60, 300, 600, 1800, 3600]);
		});
	});

	describe('httpMetrics', () => {
		it('should create http metrics with default prefix', () => {
			const metrics = MetricsFactory.httpMetrics();

			expect(metrics).toHaveLength(3);
			expect(metrics[0].name).toBe('http_requests_total');
			expect(metrics[1].name).toBe('http_request_duration_seconds');
			expect(metrics[2].name).toBe('http_requests_in_progress');
		});

		it('should create http metrics with custom prefix', () => {
			const metrics = MetricsFactory.httpMetrics('api');

			expect(metrics).toHaveLength(3);
			expect(metrics[0].name).toBe('api_requests_total');
			expect(metrics[1].name).toBe('api_request_duration_seconds');
			expect(metrics[2].name).toBe('api_requests_in_progress');
		});

		it('should have correct metric types', () => {
			const metrics = MetricsFactory.httpMetrics();

			expect(metrics[0].type).toBe('counter');
			expect(metrics[1].type).toBe('histogram');
			expect(metrics[2].type).toBe('gauge');
		});

		it('should have correct label names', () => {
			const metrics = MetricsFactory.httpMetrics();

			expect(metrics[0].labelNames).toEqual(['method', 'path', 'status_code']);
			expect(metrics[1].labelNames).toEqual(['method', 'path']);
			expect(metrics[2].labelNames).toEqual(['method']);
		});
	});

	describe('databaseMetrics', () => {
		it('should create database metrics with default prefix', () => {
			const metrics = MetricsFactory.databaseMetrics();

			expect(metrics).toHaveLength(3);
			expect(metrics[0].name).toBe('database_queries_total');
			expect(metrics[1].name).toBe('database_query_duration_seconds');
			expect(metrics[2].name).toBe('database_connections_active');
		});

		it('should create database metrics with custom prefix', () => {
			const metrics = MetricsFactory.databaseMetrics('db');

			expect(metrics).toHaveLength(3);
			expect(metrics[0].name).toBe('db_queries_total');
			expect(metrics[1].name).toBe('db_query_duration_seconds');
			expect(metrics[2].name).toBe('db_connections_active');
		});

		it('should have correct metric types', () => {
			const metrics = MetricsFactory.databaseMetrics();

			expect(metrics[0].type).toBe('counter');
			expect(metrics[1].type).toBe('histogram');
			expect(metrics[2].type).toBe('gauge');
		});

		it('should have correct label names', () => {
			const metrics = MetricsFactory.databaseMetrics();

			expect(metrics[0].labelNames).toEqual(['operation', 'table']);
			expect(metrics[1].labelNames).toEqual(['operation', 'table']);
			expect(metrics[2].labelNames).toBeUndefined();
		});
	});

	describe('grpcMetrics', () => {
		it('should create grpc metrics with default prefix', () => {
			const metrics = MetricsFactory.grpcMetrics();

			expect(metrics).toHaveLength(3);
			expect(metrics[0].name).toBe('grpc_requests_total');
			expect(metrics[1].name).toBe('grpc_request_duration_seconds');
			expect(metrics[2].name).toBe('grpc_requests_in_progress');
		});

		it('should create grpc metrics with custom prefix', () => {
			const metrics = MetricsFactory.grpcMetrics('microservice');

			expect(metrics).toHaveLength(3);
			expect(metrics[0].name).toBe('microservice_requests_total');
			expect(metrics[1].name).toBe('microservice_request_duration_seconds');
			expect(metrics[2].name).toBe('microservice_requests_in_progress');
		});

		it('should have correct metric types', () => {
			const metrics = MetricsFactory.grpcMetrics();

			expect(metrics[0].type).toBe('counter');
			expect(metrics[1].type).toBe('histogram');
			expect(metrics[2].type).toBe('gauge');
		});

		it('should have correct label names', () => {
			const metrics = MetricsFactory.grpcMetrics();

			expect(metrics[0].labelNames).toEqual(['service', 'method', 'status']);
			expect(metrics[1].labelNames).toEqual(['service', 'method']);
			expect(metrics[2].labelNames).toEqual(['service']);
		});
	});

	describe('counter', () => {
		it('should create counter metric', () => {
			const metric = MetricsFactory.counter('test_counter', 'Test counter');

			expect(metric.type).toBe('counter');
			expect(metric.name).toBe('test_counter');
			expect(metric.help).toBe('Test counter');
			expect(metric.labelNames).toBeUndefined();
		});

		it('should create counter metric with labels', () => {
			const metric = MetricsFactory.counter('test_counter', 'Test counter', ['label1', 'label2']);

			expect(metric.type).toBe('counter');
			expect(metric.name).toBe('test_counter');
			expect(metric.help).toBe('Test counter');
			expect(metric.labelNames).toEqual(['label1', 'label2']);
		});
	});

	describe('gauge', () => {
		it('should create gauge metric', () => {
			const metric = MetricsFactory.gauge('test_gauge', 'Test gauge');

			expect(metric.type).toBe('gauge');
			expect(metric.name).toBe('test_gauge');
			expect(metric.help).toBe('Test gauge');
			expect(metric.labelNames).toBeUndefined();
		});

		it('should create gauge metric with labels', () => {
			const metric = MetricsFactory.gauge('test_gauge', 'Test gauge', ['label1']);

			expect(metric.type).toBe('gauge');
			expect(metric.name).toBe('test_gauge');
			expect(metric.help).toBe('Test gauge');
			expect(metric.labelNames).toEqual(['label1']);
		});
	});

	describe('histogram', () => {
		it('should create histogram metric', () => {
			const buckets = [0.1, 0.5, 1, 2, 5];
			const metric = MetricsFactory.histogram('test_histogram', 'Test histogram', buckets);

			expect(metric.type).toBe('histogram');
			expect(metric.name).toBe('test_histogram');
			expect(metric.help).toBe('Test histogram');
			expect(metric.buckets).toEqual(buckets);
			expect(metric.labelNames).toBeUndefined();
		});

		it('should create histogram metric with labels', () => {
			const buckets = [0.1, 0.5, 1, 2, 5];
			const metric = MetricsFactory.histogram('test_histogram', 'Test histogram', buckets, ['label1']);

			expect(metric.type).toBe('histogram');
			expect(metric.name).toBe('test_histogram');
			expect(metric.help).toBe('Test histogram');
			expect(metric.buckets).toEqual(buckets);
			expect(metric.labelNames).toEqual(['label1']);
		});
	});
}); 
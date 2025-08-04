import { Counter, Gauge, Histogram } from 'prom-client';
import { MetricsFactory, PrometheusService } from '@app/nest/modules';

export const WEBSOCKET_METRICS = 'WEBSOCKET_METRICS';

export interface WebSocketGatewayMetrics {
	active_location_tracking: Gauge<string>;
	location_update_duration_seconds: Histogram<string>;
	// Location tracking metrics
	location_updates_total: Counter<string>;
	user_websocket_connection_duration_seconds: Histogram<string>;
	user_websocket_connections_active: Gauge<string>;

	// User WebSocket metrics
	user_websocket_connections_total: Counter<string>;
	user_websocket_disconnections_total: Counter<string>;
	user_websocket_errors_total: Counter<string>;
	vendor_websocket_connection_duration_seconds: Histogram<string>;
	vendor_websocket_connections_active: Gauge<string>;

	// Vendor WebSocket metrics
	vendor_websocket_connections_total: Counter<string>;
	vendor_websocket_disconnections_total: Counter<string>;
	vendor_websocket_errors_total: Counter<string>;
}

export function createWebSocketMetrics(prometheusService: PrometheusService): WebSocketGatewayMetrics {
	const metrics = prometheusService.registerMetrics([
		// WebSocket metrics for user connections
		...MetricsFactory.websocketMetrics('user_websocket'),

		// WebSocket metrics for vendor connections
		...MetricsFactory.websocketMetrics('vendor_websocket'),

		// Custom metrics specific to location tracking
		MetricsFactory.counter('location_updates_total', 'Total location updates', ['type', 'status']),
		MetricsFactory.histogram(
			'location_update_duration_seconds',
			'Location update processing time',
			[0.01, 0.1, 0.5, 1, 2, 5],
			['type'],
		),
		MetricsFactory.gauge('active_location_tracking', 'Number of active location tracking sessions', ['type']),
	]);

	return {
		active_location_tracking: metrics.active_location_tracking as Gauge<string>,
		location_update_duration_seconds: metrics.location_update_duration_seconds as Histogram<string>,
		location_updates_total: metrics.location_updates_total as Counter<string>,
		user_websocket_connection_duration_seconds: metrics.user_websocket_connection_duration_seconds as Histogram<string>,
		user_websocket_connections_active: metrics.user_websocket_connections_active as Gauge<string>,
		user_websocket_connections_total: metrics.user_websocket_connections_total as Counter<string>,
		user_websocket_disconnections_total: metrics.user_websocket_disconnections_total as Counter<string>,
		user_websocket_errors_total: metrics.user_websocket_errors_total as Counter<string>,
		vendor_websocket_connection_duration_seconds:
			metrics.vendor_websocket_connection_duration_seconds as Histogram<string>,
		vendor_websocket_connections_active: metrics.vendor_websocket_connections_active as Gauge<string>,
		vendor_websocket_connections_total: metrics.vendor_websocket_connections_total as Counter<string>,
		vendor_websocket_disconnections_total: metrics.vendor_websocket_disconnections_total as Counter<string>,
		vendor_websocket_errors_total: metrics.vendor_websocket_errors_total as Counter<string>,
	};
}

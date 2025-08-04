import { PrometheusService, MetricsFactory, PrometheusMetrics } from '@app/nest/modules';

export const WEBSOCKET_METRICS = 'WEBSOCKET_METRICS';

export interface WebSocketGatewayMetrics {
	// User WebSocket metrics
	user_websocket_connections_total: PrometheusMetrics['user_websocket_connections_total'];
	user_websocket_connections_active: PrometheusMetrics['user_websocket_connections_active'];
	user_websocket_connection_duration_seconds: PrometheusMetrics['user_websocket_connection_duration_seconds'];
	user_websocket_errors_total: PrometheusMetrics['user_websocket_errors_total'];
	user_websocket_disconnections_total: PrometheusMetrics['user_websocket_disconnections_total'];
	
	// Vendor WebSocket metrics
	vendor_websocket_connections_total: PrometheusMetrics['vendor_websocket_connections_total'];
	vendor_websocket_connections_active: PrometheusMetrics['vendor_websocket_connections_active'];
	vendor_websocket_connection_duration_seconds: PrometheusMetrics['vendor_websocket_connection_duration_seconds'];
	vendor_websocket_errors_total: PrometheusMetrics['vendor_websocket_errors_total'];
	vendor_websocket_disconnections_total: PrometheusMetrics['vendor_websocket_disconnections_total'];
	
	// Location tracking metrics
	location_updates_total: PrometheusMetrics['location_updates_total'];
	location_update_duration_seconds: PrometheusMetrics['location_update_duration_seconds'];
	active_location_tracking: PrometheusMetrics['active_location_tracking'];
}

export function createWebSocketMetrics(prometheusService: PrometheusService): WebSocketGatewayMetrics {
	return prometheusService.registerMetrics([
		// WebSocket metrics for user connections
		...MetricsFactory.websocketMetrics('user_websocket'),
		
		// WebSocket metrics for vendor connections
		...MetricsFactory.websocketMetrics('vendor_websocket'),
		
		// Custom metrics specific to location tracking
		MetricsFactory.counter('location_updates_total', 'Total location updates', ['type', 'status']),
		MetricsFactory.histogram('location_update_duration_seconds', 'Location update processing time', [0.01, 0.1, 0.5, 1, 2, 5], ['type']),
		MetricsFactory.gauge('active_location_tracking', 'Number of active location tracking sessions', ['type']),
	]) as WebSocketGatewayMetrics;
} 
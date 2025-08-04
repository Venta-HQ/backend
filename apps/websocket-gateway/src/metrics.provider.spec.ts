import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWebSocketMetrics } from './metrics.provider';

describe('WebSocket Metrics Provider', () => {
	let mockPrometheusService: any;

	beforeEach(() => {
		mockPrometheusService = {
			registerMetrics: vi.fn(),
		};
	});

	describe('createWebSocketMetrics', () => {
		it('should register all required metrics', () => {
			const mockMetrics = {
				active_location_tracking: {},
				location_update_duration_seconds: {},
				location_updates_total: {},
				user_websocket_connection_duration_seconds: {},
				user_websocket_connections_active: {},
				user_websocket_connections_total: {},
				user_websocket_disconnections_total: {},
				user_websocket_errors_total: {},
				vendor_websocket_connection_duration_seconds: {},
				vendor_websocket_connections_active: {},
				vendor_websocket_connections_total: {},
				vendor_websocket_disconnections_total: {},
				vendor_websocket_errors_total: {},
			};

			mockPrometheusService.registerMetrics.mockReturnValue(mockMetrics);

			const result = createWebSocketMetrics(mockPrometheusService);

			expect(mockPrometheusService.registerMetrics).toHaveBeenCalledWith(
				expect.arrayContaining([
					// User WebSocket metrics
					expect.objectContaining({ name: 'user_websocket_connections_total' }),
					expect.objectContaining({ name: 'user_websocket_connections_active' }),
					expect.objectContaining({ name: 'user_websocket_connection_duration_seconds' }),
					expect.objectContaining({ name: 'user_websocket_errors_total' }),
					expect.objectContaining({ name: 'user_websocket_disconnections_total' }),
					// Vendor WebSocket metrics
					expect.objectContaining({ name: 'vendor_websocket_connections_total' }),
					expect.objectContaining({ name: 'vendor_websocket_connections_active' }),
					expect.objectContaining({ name: 'vendor_websocket_connection_duration_seconds' }),
					expect.objectContaining({ name: 'vendor_websocket_errors_total' }),
					expect.objectContaining({ name: 'vendor_websocket_disconnections_total' }),
					// Location tracking metrics
					expect.objectContaining({ name: 'location_updates_total' }),
					expect.objectContaining({ name: 'location_update_duration_seconds' }),
					expect.objectContaining({ name: 'active_location_tracking' }),
				]),
			);

			expect(result).toStrictEqual(mockMetrics);
		});

		it('should register correct number of metrics', () => {
			const mockMetrics = {};
			mockPrometheusService.registerMetrics.mockReturnValue(mockMetrics);

			createWebSocketMetrics(mockPrometheusService);

			const registeredMetrics = mockPrometheusService.registerMetrics.mock.calls[0][0];
			expect(registeredMetrics).toHaveLength(13); // 5 user + 5 vendor + 3 location
		});

		it('should include user websocket metrics with correct configuration', () => {
			const mockMetrics = {};
			mockPrometheusService.registerMetrics.mockReturnValue(mockMetrics);

			createWebSocketMetrics(mockPrometheusService);

			const registeredMetrics = mockPrometheusService.registerMetrics.mock.calls[0][0];
			const userConnectionsTotal = registeredMetrics.find((m) => m.name === 'user_websocket_connections_total');

			expect(userConnectionsTotal).toBeDefined();
			expect(userConnectionsTotal?.type).toBe('counter');
			expect(userConnectionsTotal?.labelNames).toEqual(['type', 'status']);
		});

		it('should include vendor websocket metrics with correct configuration', () => {
			const mockMetrics = {};
			mockPrometheusService.registerMetrics.mockReturnValue(mockMetrics);

			createWebSocketMetrics(mockPrometheusService);

			const registeredMetrics = mockPrometheusService.registerMetrics.mock.calls[0][0];
			const vendorConnectionsActive = registeredMetrics.find((m) => m.name === 'vendor_websocket_connections_active');

			expect(vendorConnectionsActive).toBeDefined();
			expect(vendorConnectionsActive?.type).toBe('gauge');
			expect(vendorConnectionsActive?.labelNames).toEqual(['type']);
		});

		it('should include location tracking metrics with correct configuration', () => {
			const mockMetrics = {};
			mockPrometheusService.registerMetrics.mockReturnValue(mockMetrics);

			createWebSocketMetrics(mockPrometheusService);

			const registeredMetrics = mockPrometheusService.registerMetrics.mock.calls[0][0];
			const locationUpdatesTotal = registeredMetrics.find((m) => m.name === 'location_updates_total');

			expect(locationUpdatesTotal).toBeDefined();
			expect(locationUpdatesTotal?.type).toBe('counter');
			expect(locationUpdatesTotal?.labelNames).toEqual(['type', 'status']);
		});
	});
});

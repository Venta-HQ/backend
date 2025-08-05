import { vi } from 'vitest';
import { TestingModule } from '@nestjs/testing';
import { createMockDependencies, createMockProvider, createTestModule } from './test-utils';

/**
 * Base class for WebSocket gateway tests to reduce duplication
 */
export abstract class BaseWebSocketGatewayTest {
	protected gateway: any;
	protected module: TestingModule;
	protected mockDeps: ReturnType<typeof createMockDependencies>;
	protected mockConnectionManager: any;
	protected mockVendorConnectionManager: any;
	protected mockLocationService: any;

	protected abstract getGatewayClass(): any;
	protected abstract getConnectionManagerClass(): any;
	protected abstract getVendorConnectionManagerClass(): any;
	protected abstract getLocationServiceClass(): any;
	protected abstract getMetricsPrefix(): string;

	protected async setupGateway() {
		this.mockDeps = createMockDependencies({
			websocketMetrics: {
				[`${this.getMetricsPrefix()}_connection_duration_seconds`]: { observe: vi.fn() },
				[`${this.getMetricsPrefix()}_connections_active`]: { dec: vi.fn(), inc: vi.fn() },
				[`${this.getMetricsPrefix()}_connections_total`]: { inc: vi.fn() },
				[`${this.getMetricsPrefix()}_disconnections_total`]: { inc: vi.fn() },
				[`${this.getMetricsPrefix()}_errors_total`]: { inc: vi.fn() },
				location_updates_total: { inc: vi.fn() },
				location_update_duration_seconds: { observe: vi.fn() },
				active_location_tracking: { set: vi.fn() },
			},
		});

		this.mockConnectionManager = new this.getConnectionManagerClass();
		this.mockVendorConnectionManager = new this.getVendorConnectionManagerClass();
		this.mockLocationService = new this.getLocationServiceClass();

		this.module = await createTestModule(
			[this.getGatewayClass()],
			[],
			[
				createMockProvider('LocationService', this.mockLocationService),
				{ provide: this.getConnectionManagerClass(), useValue: this.mockConnectionManager },
				{ provide: this.getVendorConnectionManagerClass(), useValue: this.mockVendorConnectionManager },
				createMockProvider('WEBSOCKET_METRICS', this.mockDeps.websocketMetrics),
				createMockProvider('default_IORedisModuleConnectionToken', this.mockDeps.redis),
				createMockProvider('ClerkService', this.mockDeps.clerkService),
			],
		);

		this.gateway = this.module.get(this.getGatewayClass());
		this.gateway.server = { emit: vi.fn() } as any;

		// Manually assign the mock connection manager to bypass DI issues
		(this.gateway as any).connectionManager = this.mockConnectionManager;
	}

	protected async teardownGateway() {
		await this.module.close();
	}

	protected createMockSocket(overrides: any = {}) {
		return {
			id: 'socket-123',
			clerkId: 'user-123',
			userId: 'user-123',
			vendorId: 'vendor-123',
			emit: vi.fn(),
			to: vi.fn().mockReturnValue({
				emit: vi.fn(),
			}),
			join: vi.fn(),
			leave: vi.fn(),
			...overrides,
		};
	}

	protected expectMetricsCalled(metricName: string, labels: any = {}) {
		const metric = this.mockDeps.websocketMetrics[metricName];
		if (metric) {
			expect(metric.inc).toHaveBeenCalledWith(labels);
		}
	}

	protected expectConnectionManagerCalled(method: string, ...args: any[]) {
		expect(this.mockConnectionManager[method]).toHaveBeenCalledWith(...args);
	}
}

/**
 * Mock classes for WebSocket tests
 */
export class MockUserConnectionManagerService {
	addUserToVendorRoom = vi.fn();
	getUserVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerUser = vi.fn();
	removeUserFromVendorRoom = vi.fn();
}

export class MockVendorConnectionManagerService {
	addVendorToRoom = vi.fn();
	getVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerVendor = vi.fn();
	removeVendorFromRoom = vi.fn();
}

export class MockGrpcInstance {
	invoke = vi.fn().mockReturnValue({
		toPromise: vi.fn().mockResolvedValue({
			vendors: [
				{ id: 'vendor-1', name: 'Vendor 1' },
				{ id: 'vendor-2', name: 'Vendor 2' },
			],
		}),
	});
}

/**
 * Creates standardized WebSocket connection tests
 */
export function createWebSocketConnectionTests(
	gateway: any,
	mockDeps: any,
	connectionManager: any,
	metricsPrefix: string,
) {
	return {
		success: async (socket: any) => {
			await gateway.handleConnection(socket);

			expect(mockDeps.websocketMetrics[`${metricsPrefix}_connections_total`].inc).toHaveBeenCalledWith({
				status: 'connected',
				type: metricsPrefix.replace('_', ''),
			});
			expect(mockDeps.websocketMetrics[`${metricsPrefix}_connections_active`].inc).toHaveBeenCalledWith({
				type: metricsPrefix.replace('_', ''),
			});
		},

		error: async (socket: any, errorMessage: string) => {
			// Mock the metrics to throw an error
			const originalInc = mockDeps.websocketMetrics[`${metricsPrefix}_connections_total`].inc;
			mockDeps.websocketMetrics[`${metricsPrefix}_connections_total`].inc = vi.fn().mockImplementation(() => {
				throw new Error(errorMessage);
			});

			await expect(gateway.handleConnection(socket)).rejects.toThrow(errorMessage);

			// Restore the original mock
			mockDeps.websocketMetrics[`${metricsPrefix}_connections_total`].inc = originalInc;
		},
	};
}

/**
 * Creates standardized WebSocket disconnection tests
 */
export function createWebSocketDisconnectionTests(
	gateway: any,
	mockDeps: any,
	connectionManager: any,
	metricsPrefix: string,
) {
	return {
		success: (socket: any) => {
			gateway.handleDisconnect(socket);

			expect(mockDeps.websocketMetrics[`${metricsPrefix}_disconnections_total`].inc).toHaveBeenCalledWith({
				reason: 'disconnect',
				type: metricsPrefix.replace('_', ''),
			});
			expect(mockDeps.websocketMetrics[`${metricsPrefix}_connections_active`].dec).toHaveBeenCalledWith({
				type: metricsPrefix.replace('_', ''),
			});
			expect(connectionManager.handleDisconnect).toHaveBeenCalledWith('socket-123');
		},

		error: async (socket: any, errorMessage: string) => {
			// Mock the metrics to throw an error
			const originalInc = mockDeps.websocketMetrics[`${metricsPrefix}_disconnections_total`].inc;
			mockDeps.websocketMetrics[`${metricsPrefix}_disconnections_total`].inc = vi.fn().mockImplementation(() => {
				throw new Error(errorMessage);
			});

			await expect(gateway.handleDisconnect(socket)).rejects.toThrow(errorMessage);

			// Restore the original mock
			mockDeps.websocketMetrics[`${metricsPrefix}_disconnections_total`].inc = originalInc;
		},
	};
}

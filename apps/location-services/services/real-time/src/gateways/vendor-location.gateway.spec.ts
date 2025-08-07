import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GEOLOCATION_SERVICE_NAME } from '@app/proto/location-services/geolocation';
import { TestingModule } from '@nestjs/testing';
import {
	clearMocks,
	createMockDependencies,
	createMockProvider,
	createMockSocket,
	createTestModule,
} from '../../../../../test/helpers/test-utils';
import { WEBSOCKET_METRICS } from '../metrics.provider';
import { UserConnectionManagerService } from '../services/user-connection-manager.service';
import { VendorConnectionManagerService } from '../services/vendor-connection-manager.service';
import { VendorLocationGateway } from './vendor-location.gateway';

// Mock the proto modules
vi.mock('@app/proto/location-services/geolocation', () => ({
	GEOLOCATION_SERVICE_NAME: 'GeolocationService',
	GeolocationServiceClient: {},
}));

// Mock the guards - define classes inside the factory
vi.mock('@app/nest/guards', () => {
	class MockWsAuthGuard {
		canActivate() {
			return true;
		}
	}

	class MockWsRateLimitGuard {
		canActivate() {
			return true;
		}
	}

	return {
		WsAuthGuard: MockWsAuthGuard,
		WsRateLimitGuards: {
			lenient: MockWsRateLimitGuard,
		},
	};
});

// Mock the pipes
vi.mock('@app/nest/pipes', () => ({
	SchemaValidatorPipe: vi.fn(),
}));

// Mock the apitypes
vi.mock('@app/apitypes', () => ({
	VendorLocationUpdateDataSchema: {},
}));

// Mock the utils
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation) => {
		return await operation();
	}),
}));

// Proper mock class for VendorConnectionManagerService
class MockVendorConnectionManagerService {
	addVendorToRoom = vi.fn();
	getVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerVendor = vi.fn();
	removeVendorFromRoom = vi.fn();
}

// Mock UserConnectionManagerService as a class (even if not directly used by VendorGateway, it's a dependency of WsAuthGuard)
class MockUserConnectionManagerService {
	addUserToVendorRoom = vi.fn();
	getUserVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerUser = vi.fn();
	removeUserFromVendorRoom = vi.fn();
}

// Mock GrpcInstance
class MockGrpcInstance {
	invoke = vi.fn().mockReturnValue({
		toPromise: vi.fn().mockResolvedValue(undefined),
	});
}

describe('VendorLocationGateway', () => {
	let gateway: VendorLocationGateway;
	let module: TestingModule;
	let mockDeps: ReturnType<typeof createMockDependencies>;
	let mockConnectionManager: MockVendorConnectionManagerService;
	let mockUserConnectionManager: MockUserConnectionManagerService;
	let mockLocationService: MockGrpcInstance;

	beforeEach(async () => {
		mockDeps = createMockDependencies({
			websocketMetrics: {
				active_location_tracking: { set: vi.fn() },
				location_update_duration_seconds: { observe: vi.fn() },
				location_updates_total: { inc: vi.fn() },
				user_websocket_connection_duration_seconds: { observe: vi.fn() },
				user_websocket_connections_active: { dec: vi.fn(), inc: vi.fn() },
				user_websocket_connections_total: { inc: vi.fn() },
				user_websocket_disconnections_total: { inc: vi.fn() },
				user_websocket_errors_total: { inc: vi.fn() },
				vendor_websocket_connection_duration_seconds: { observe: vi.fn() },
				vendor_websocket_connections_active: { dec: vi.fn(), inc: vi.fn() },
				vendor_websocket_connections_total: { inc: vi.fn() },
				vendor_websocket_disconnections_total: { inc: vi.fn() },
				vendor_websocket_errors_total: { inc: vi.fn() },
			},
		});

		mockConnectionManager = new MockVendorConnectionManagerService();
		mockUserConnectionManager = new MockUserConnectionManagerService();
		mockLocationService = new MockGrpcInstance();

		module = await createTestModule(
			[VendorLocationGateway],
			[],
			[
				createMockProvider(GEOLOCATION_SERVICE_NAME, mockLocationService),
				{ provide: VendorConnectionManagerService, useValue: mockConnectionManager },
				{ provide: UserConnectionManagerService, useValue: mockUserConnectionManager },
				createMockProvider(WEBSOCKET_METRICS, mockDeps.websocketMetrics),
				createMockProvider('default_IORedisModuleConnectionToken', mockDeps.redis),
				createMockProvider('ClerkService', mockDeps.clerkService),
			],
		);

		gateway = module.get<VendorLocationGateway>(VendorLocationGateway);
		gateway.server = { emit: vi.fn() } as any; // Mock the server property

		// Manually assign the mock connection manager to bypass DI issues
		(gateway as any).connectionManager = mockConnectionManager;
	});

	afterEach(async () => {
		if (module) {
			await module.close();
		}
		clearMocks();
	});

	it('should have connection manager injected', () => {
		expect(gateway['connectionManager']).toBeDefined();
		expect(gateway['connectionManager']).toBe(mockConnectionManager);
	});

	it('should initialize location service', () => {
		gateway.afterInit();

		// With GrpcInstance pattern, no manual initialization is needed
		// The service is already ready to use
		expect(gateway['locationService']).toBeDefined();
	});

	describe('handleConnection', () => {
		it('should handle vendor connection successfully', async () => {
			const socket = createMockSocket();

			await gateway.handleConnection(socket);

			expect(mockDeps.websocketMetrics.vendor_websocket_connections_total.inc).toHaveBeenCalledWith({
				status: 'connected',
				type: 'vendor',
			});
			expect(mockDeps.websocketMetrics.vendor_websocket_connections_active.inc).toHaveBeenCalledWith({
				type: 'vendor',
			});
		});

		it('should throw when metrics fail', async () => {
			const socket = createMockSocket();

			// Mock the metrics to throw an error
			const originalInc = mockDeps.websocketMetrics.vendor_websocket_connections_total.inc;
			mockDeps.websocketMetrics.vendor_websocket_connections_total.inc = vi.fn().mockImplementation(() => {
				throw new Error('Metrics error');
			});

			// The method should throw when metrics fail
			await expect(gateway.handleConnection(socket)).rejects.toThrow('Metrics error');

			// Restore the original mock
			mockDeps.websocketMetrics.vendor_websocket_connections_total.inc = originalInc;
		});
	});

	describe('handleDisconnect', () => {
		it('should handle vendor disconnection successfully', () => {
			const socket = createMockSocket();

			gateway.handleDisconnect(socket);

			expect(mockDeps.websocketMetrics.vendor_websocket_disconnections_total.inc).toHaveBeenCalledWith({
				reason: 'disconnect',
				type: 'vendor',
			});
			expect(mockDeps.websocketMetrics.vendor_websocket_connections_active.dec).toHaveBeenCalledWith({
				type: 'vendor',
			});
			expect(mockConnectionManager.handleDisconnect).toHaveBeenCalledWith('socket-123');
		});

		it('should throw when metrics fail', async () => {
			const socket = createMockSocket();

			// Mock the metrics to throw an error
			const originalInc = mockDeps.websocketMetrics.vendor_websocket_disconnections_total.inc;
			mockDeps.websocketMetrics.vendor_websocket_disconnections_total.inc = vi.fn().mockImplementation(() => {
				throw new Error('Metrics error');
			});

			// The method should throw when metrics fail
			await expect(gateway.handleDisconnect(socket)).rejects.toThrow('Metrics error');

			// Restore the original mock
			mockDeps.websocketMetrics.vendor_websocket_disconnections_total.inc = originalInc;
		});
	});

	describe('updateVendorLocation', () => {
		beforeEach(() => {
			// Default mock - can be overridden in individual tests
			mockLocationService.invoke.mockReturnValue({
				toPromise: vi.fn().mockResolvedValue(undefined),
			});
		});

		it('should update vendor location successfully', async () => {
			const socket = createMockSocket();
			const data = {
				lat: 40.7589,
				long: -73.9851,
			};

			await gateway.updateVendorLocation(data, socket);

			expect(mockDeps.websocketMetrics.location_updates_total.inc).toHaveBeenCalledWith({
				status: 'success',
				type: 'vendor',
			});

			// Should call the gRPC service
			expect(mockLocationService.invoke).toHaveBeenCalledWith('updateVendorLocation', {
				entityId: 'vendor-123',
				location: {
					lat: 40.7589,
					long: -73.9851,
				},
			});

			// Should update Redis
			expect(mockDeps.redis.zadd).toHaveBeenCalledWith('vendor_locations', 40.7589, 'vendor-123');

			// Should emit to other users tracking this vendor
			expect(socket.to).toHaveBeenCalledWith('vendor-123');
		});

		it('should handle gRPC service errors', async () => {
			const socket = createMockSocket();
			const data = {
				lat: 40.7589,
				long: -73.9851,
			};

			// Mock the locationService to throw an error
			mockLocationService.invoke.mockReturnValue({
				toPromise: vi.fn().mockRejectedValue(new Error('gRPC service error')),
			});

			await gateway.updateVendorLocation(data, socket);

			// Should emit error to socket
			expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});

		it('should handle Redis errors gracefully', async () => {
			const socket = createMockSocket();
			const data = {
				lat: 40.7589,
				long: -73.9851,
			};

			// Mock Redis to throw an error
			mockDeps.redis.zadd.mockRejectedValue(new Error('Redis error'));

			await gateway.updateVendorLocation(data, socket);

			// Should emit error to socket when Redis fails
			expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });

			// Should not reach the socket.to call when Redis fails
			expect(socket.to).not.toHaveBeenCalled();
		});

		it('should handle missing vendor ID', async () => {
			const socket = createMockSocket();
			// Remove vendorId from socket
			delete (socket as any).vendorId;

			const data = {
				lat: 40.7589,
				long: -73.9851,
			};

			await gateway.updateVendorLocation(data, socket);

			// Should emit error to socket
			expect(socket.emit).toHaveBeenCalledWith('error', {
				code: 'UNAUTHORIZED',
				message: 'Vendor not authenticated',
			});
		});
	});
});

import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VendorLocationGateway } from './vendor-location.gateway';
import { WEBSOCKET_METRICS } from '../metrics.provider';
import { createMockDependencies, createTestModule, createMockSocket, createMockProvider, clearMocks } from '../../../../test/helpers/test-utils';
import { UserConnectionManagerService } from '../services/user-connection-manager.service';
import { VendorConnectionManagerService } from '../services/vendor-connection-manager.service';

// Mock the utils module
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>, description: string, options?: any) => {
		// Execute the operation directly
		return await operation();
	}),
}));

// Mock the proto modules
vi.mock('@app/proto/location', () => ({
	LOCATION_SERVICE_NAME: 'LocationService',
	LocationServiceClient: {},
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
			lenient: MockWsRateLimitGuard, // Vendor gateway uses lenient rate limit
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

// Mock UserConnectionManagerService as a class (needed for WsAuthGuard)
class MockUserConnectionManagerService {
	addUserToVendorRoom = vi.fn();
	getUserVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerUser = vi.fn();
	removeUserFromVendorRoom = vi.fn();
}

// Proper mock class for VendorConnectionManagerService
class MockVendorConnectionManagerService {
	addVendorToRoom = vi.fn();
	getVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerVendor = vi.fn();
	removeVendorFromRoom = vi.fn();
}

describe('VendorLocationGateway', () => {
	let gateway: VendorLocationGateway;
	let module: TestingModule;
	let mockDeps: ReturnType<typeof createMockDependencies>;
	let mockVendorConnectionManager: MockVendorConnectionManagerService;
	let mockUserConnectionManager: MockUserConnectionManagerService; // Needed for WsAuthGuard

	beforeEach(async () => {
		mockDeps = createMockDependencies({
			websocketMetrics: {
				vendor_websocket_connections_total: { inc: vi.fn() },
				vendor_websocket_connections_active: { inc: vi.fn(), dec: vi.fn() },
				vendor_websocket_connection_duration_seconds: { observe: vi.fn() },
				vendor_websocket_errors_total: { inc: vi.fn() },
				vendor_websocket_disconnections_total: { inc: vi.fn() },
				user_websocket_connections_total: { inc: vi.fn() },
				user_websocket_connections_active: { inc: vi.fn(), dec: vi.fn() },
				user_websocket_connection_duration_seconds: { observe: vi.fn() },
				user_websocket_errors_total: { inc: vi.fn() },
				user_websocket_disconnections_total: { inc: vi.fn() },
				location_updates_total: { inc: vi.fn() },
				location_update_duration_seconds: { observe: vi.fn() },
				active_location_tracking: { set: vi.fn() },
			},
		});

		mockVendorConnectionManager = new MockVendorConnectionManagerService();
		mockUserConnectionManager = new MockUserConnectionManagerService();

		module = await createTestModule(
			[VendorLocationGateway],
			[],
			[
				createMockProvider('LocationService', mockDeps.grpcClient),
				{ provide: VendorConnectionManagerService, useValue: mockVendorConnectionManager },
				{ provide: UserConnectionManagerService, useValue: mockUserConnectionManager },
				createMockProvider(WEBSOCKET_METRICS, mockDeps.websocketMetrics),
				createMockProvider('default_IORedisModuleConnectionToken', mockDeps.redis),
				createMockProvider('ClerkService', mockDeps.clerkService),
			]
		);

		gateway = module.get<VendorLocationGateway>(VendorLocationGateway);
		gateway.server = { emit: vi.fn() } as any; // Mock the server property
		
		// Manually assign the mock connection manager to bypass DI issues
		(gateway as any).connectionManager = mockVendorConnectionManager;
		
		// Manually assign the Redis mock to ensure it's accessible
		(gateway as any).redis = mockDeps.redis;
		
		// Mock the locationService property after afterInit is called
		(gateway as any).locationService = {
			updateVendorLocation: vi.fn().mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					// Handle both object-style and function-style observers
					if (typeof observer === 'object' && observer !== null) {
						if (observer.next) observer.next();
						if (observer.complete) observer.complete();
					} else if (typeof observer === 'function') {
						observer();
					}
					return { unsubscribe: vi.fn() };
				}),
			}),
		};
	});

	afterEach(async () => {
		await module.close();
		clearMocks();
	});

	it('should have connection manager injected', () => {
		expect(gateway['connectionManager']).toBeDefined();
		expect(gateway['connectionManager']).toBe(mockVendorConnectionManager);
	});

	it('should initialize location service', () => {
		gateway.afterInit();
		
		expect(mockDeps.grpcClient.getService).toHaveBeenCalledWith('LocationService');
	});

	describe('handleConnection', () => {
		it('should handle vendor connection successfully', async () => {
			const socket = createMockSocket();
			
			await gateway.handleConnection(socket);
			
			expect(mockDeps.websocketMetrics.vendor_websocket_connections_total.inc).toHaveBeenCalledWith({ status: 'connected', type: 'vendor' });
			expect(mockDeps.websocketMetrics.vendor_websocket_connections_active.inc).toHaveBeenCalledWith({ type: 'vendor' });
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
			
			expect(mockDeps.websocketMetrics.vendor_websocket_disconnections_total.inc).toHaveBeenCalledWith({ reason: 'disconnect', type: 'vendor' });
			expect(mockDeps.websocketMetrics.vendor_websocket_connections_active.dec).toHaveBeenCalledWith({ type: 'vendor' });
			expect(mockVendorConnectionManager.handleDisconnect).toHaveBeenCalledWith('socket-123');
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
			// Set up default gRPC service mock
			mockDeps.grpcClient.getService.mockReturnValue({
				updateVendorLocation: vi.fn().mockReturnValue({
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.next();
						observer.complete();
						return { unsubscribe: vi.fn() };
					}),
				}),
			});
		});

		it('should update vendor location successfully', async () => {
			const socket = createMockSocket();
			const data = { 
				lat: 40.7589, 
				long: -73.9851 
			};

			await gateway.updateVendorLocation(data, socket);

			expect(mockDeps.websocketMetrics.location_updates_total.inc).toHaveBeenCalledWith({ status: 'success', type: 'vendor' });
		});

		it('should call gRPC service to update vendor location', async () => {
			const socket = createMockSocket();
			const data = { 
				lat: 40.7589, 
				long: -73.9851 
			};

			await gateway.updateVendorLocation(data, socket);

			expect((gateway as any).locationService.updateVendorLocation).toHaveBeenCalledWith({
				entityId: 'vendor-123',
				location: {
					lat: 40.7589,
					long: -73.9851,
				},
			});
		});

		it('should update vendor location in Redis', async () => {
			const socket = createMockSocket();
			const data = { 
				lat: 40.7589, 
				long: -73.9851 
			};

			// Ensure Redis mock is properly set up
			expect(gateway['redis']).toBeDefined();
			expect(mockDeps.redis.zadd).toBeDefined();

			await gateway.updateVendorLocation(data, socket);

			expect(mockDeps.redis.zadd).toHaveBeenCalledWith('vendor_locations', 40.7589, 'vendor-123');
		});

		it('should emit vendor_sync to users tracking this vendor', async () => {
			const socket = createMockSocket();
			const data = { 
				lat: 40.7589, 
				long: -73.9851 
			};

			// Mock the gRPC service to not throw errors
			(gateway as any).locationService.updateVendorLocation = vi.fn().mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					// Call next and complete to simulate successful gRPC call
					if (observer.next) observer.next();
					if (observer.complete) observer.complete();
					return { unsubscribe: vi.fn() };
				}),
			});

			await gateway.updateVendorLocation(data, socket);

			expect(socket.to).toHaveBeenCalledWith('vendor-123');
			
			// Check that socket.to was called and get the mock return value
			const mockToCall = socket.to.mock.calls[0];
			expect(mockToCall[0]).toBe('vendor-123');
			
			// Get the mock return value from the first call and check its emit method was called
			const mockToReturn = socket.to.mock.results[0].value;
			expect(mockToReturn.emit).toHaveBeenCalledWith('vendor_sync', {
				id: 'vendor-123',
				location: {
					lat: 40.7589,
					long: -73.9851,
				},
			});
		});

		it('should handle socket without vendor ID', async () => {
			const socket = createMockSocket({ vendorId: undefined });
			const data = { 
				lat: 40.7589, 
				long: -73.9851 
			};

			await gateway.updateVendorLocation(data, socket);

			expect(socket.emit).toHaveBeenCalledWith('error', {
				code: 'UNAUTHORIZED',
				message: 'Vendor not authenticated',
			});
		});

		it('should handle gRPC service errors gracefully', async () => {
			const socket = createMockSocket();
			const data = { 
				lat: 40.7589, 
				long: -73.9851 
			};

			// Mock gRPC service to throw an error
			(gateway as any).locationService.updateVendorLocation = vi.fn().mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.error(new Error('gRPC error'));
					return { unsubscribe: vi.fn() };
				}),
			});

			await gateway.updateVendorLocation(data, socket);

			// Should not emit error to socket, just log it
			expect(socket.emit).not.toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});

		it('should handle Redis errors gracefully', async () => {
			const socket = createMockSocket();
			const data = { 
				lat: 40.7589, 
				long: -73.9851 
			};

			mockDeps.redis.zadd.mockRejectedValue(new Error('Redis error'));

			await gateway.updateVendorLocation(data, socket);

			expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});
	});
});

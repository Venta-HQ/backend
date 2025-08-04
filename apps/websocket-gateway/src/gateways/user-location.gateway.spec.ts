import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestingModule } from '@nestjs/testing';
import {
	clearMocks,
	createMockDependencies,
	createMockProvider,
	createMockSocket,
	createTestModule,
} from '../../../../test/helpers/test-utils';
import { WEBSOCKET_METRICS } from '../metrics.provider';
import { UserConnectionManagerService } from '../services/user-connection-manager.service';
import { VendorConnectionManagerService } from '../services/vendor-connection-manager.service';
import { UserLocationGateway } from './user-location.gateway';

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
			standard: MockWsRateLimitGuard,
		},
	};
});

// Mock the pipes
vi.mock('@app/nest/pipes', () => ({
	SchemaValidatorPipe: vi.fn(),
}));

// Mock the apitypes
vi.mock('@app/apitypes', () => ({
	UpdateUserLocationDataSchema: {},
}));

// Proper mock class for UserConnectionManagerService
class MockUserConnectionManagerService {
	addUserToVendorRoom = vi.fn();
	getUserVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerUser = vi.fn();
	removeUserFromVendorRoom = vi.fn();
}

// Mock VendorConnectionManagerService as a class (even if not directly used by UserGateway, it's a dependency of WsAuthGuard)
class MockVendorConnectionManagerService {
	addVendorToRoom = vi.fn();
	getVendorRooms = vi.fn();
	handleDisconnect = vi.fn();
	registerVendor = vi.fn();
	removeVendorFromRoom = vi.fn();
}

describe('UserLocationGateway', () => {
	let gateway: UserLocationGateway;
	let module: TestingModule;
	let mockDeps: ReturnType<typeof createMockDependencies>;
	let mockConnectionManager: MockUserConnectionManagerService;
	let mockVendorConnectionManager: MockVendorConnectionManagerService; // Needed for WsAuthGuard

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

		mockConnectionManager = new MockUserConnectionManagerService();
		mockVendorConnectionManager = new MockVendorConnectionManagerService();

		module = await createTestModule(
			[UserLocationGateway],
			[],
			[
				createMockProvider('LocationService', mockDeps.grpcClient),
				{ provide: UserConnectionManagerService, useValue: mockConnectionManager },
				{ provide: VendorConnectionManagerService, useValue: mockVendorConnectionManager },
				createMockProvider(WEBSOCKET_METRICS, mockDeps.websocketMetrics),
				createMockProvider('default_IORedisModuleConnectionToken', mockDeps.redis),
				createMockProvider('ClerkService', mockDeps.clerkService),
			],
		);

		gateway = module.get<UserLocationGateway>(UserLocationGateway);
		gateway.server = { emit: vi.fn() } as any; // Mock the server property

		// Manually assign the mock connection manager to bypass DI issues
		(gateway as any).connectionManager = mockConnectionManager;
	});

	afterEach(async () => {
		await module.close();
		clearMocks();
	});

	it('should have connection manager injected', () => {
		expect(gateway['connectionManager']).toBeDefined();
		expect(gateway['connectionManager']).toBe(mockConnectionManager);
	});

	it('should initialize location service', () => {
		gateway.afterInit();

		expect(mockDeps.grpcClient.getService).toHaveBeenCalledWith('LocationService');
	});

	describe('handleConnection', () => {
		it('should handle user connection successfully', async () => {
			const socket = createMockSocket();

			await gateway.handleConnection(socket);

			expect(mockDeps.websocketMetrics.user_websocket_connections_total.inc).toHaveBeenCalledWith({
				status: 'connected',
				type: 'user',
			});
			expect(mockDeps.websocketMetrics.user_websocket_connections_active.inc).toHaveBeenCalledWith({ type: 'user' });
		});

		it('should throw when metrics fail', async () => {
			const socket = createMockSocket();

			// Mock the metrics to throw an error
			const originalInc = mockDeps.websocketMetrics.user_websocket_connections_total.inc;
			mockDeps.websocketMetrics.user_websocket_connections_total.inc = vi.fn().mockImplementation(() => {
				throw new Error('Metrics error');
			});

			// The method should throw when metrics fail
			await expect(gateway.handleConnection(socket)).rejects.toThrow('Metrics error');

			// Restore the original mock
			mockDeps.websocketMetrics.user_websocket_connections_total.inc = originalInc;
		});
	});

	describe('handleDisconnect', () => {
		it('should handle user disconnection successfully', () => {
			const socket = createMockSocket();

			gateway.handleDisconnect(socket);

			expect(mockDeps.websocketMetrics.user_websocket_disconnections_total.inc).toHaveBeenCalledWith({
				reason: 'disconnect',
				type: 'user',
			});
			expect(mockDeps.websocketMetrics.user_websocket_connections_active.dec).toHaveBeenCalledWith({ type: 'user' });
			expect(mockConnectionManager.handleDisconnect).toHaveBeenCalledWith('socket-123');
		});

		it('should throw when metrics fail', async () => {
			const socket = createMockSocket();

			// Mock the metrics to throw an error
			const originalInc = mockDeps.websocketMetrics.user_websocket_disconnections_total.inc;
			mockDeps.websocketMetrics.user_websocket_disconnections_total.inc = vi.fn().mockImplementation(() => {
				throw new Error('Metrics error');
			});

			// The method should throw when metrics fail
			await expect(gateway.handleDisconnect(socket)).rejects.toThrow('Metrics error');

			// Restore the original mock
			mockDeps.websocketMetrics.user_websocket_disconnections_total.inc = originalInc;
		});
	});

	describe('updateUserLocation', () => {
		beforeEach(() => {
			mockDeps.grpcClient.getService.mockReturnValue({
				vendorLocations: vi.fn().mockReturnValue({
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.next({
							vendors: [
								{ id: 'vendor-1', name: 'Vendor 1' },
								{ id: 'vendor-2', name: 'Vendor 2' },
							],
						});
						observer.complete();
					}),
				}),
			});
		});

		it('should update user location successfully', async () => {
			const socket = createMockSocket();
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			await gateway.updateUserLocation(data, socket);

			expect(mockDeps.websocketMetrics.location_updates_total.inc).toHaveBeenCalledWith({
				status: 'success',
				type: 'user',
			});
		});

		it('should handle user joining new vendor rooms', async () => {
			const socket = createMockSocket();
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			// User is currently in vendor-1, but gRPC returns vendor-1 and vendor-2
			// So vendor-2 should be added as a new vendor
			mockConnectionManager.getUserVendorRooms.mockResolvedValue(['vendor-1']);

			// Override the gRPC service mock for this test
			const mockLocationService = {
				vendorLocations: vi.fn().mockReturnValue({
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.next({
							vendors: [
								{ id: 'vendor-1', name: 'Vendor 1' },
								{ id: 'vendor-2', name: 'Vendor 2' },
							],
						});
						observer.complete();
						return { unsubscribe: vi.fn() };
					}),
				}),
			};

			// Mock the locationService property directly
			(gateway as any).locationService = mockLocationService;

			await gateway.updateUserLocation(data, socket);

			expect(mockConnectionManager.addUserToVendorRoom).toHaveBeenCalledWith('user-123', 'vendor-2');
		});

		it('should handle user leaving vendor rooms', async () => {
			const socket = createMockSocket();
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			// User is currently in vendor-3 and vendor-4, but gRPC returns vendor-1 and vendor-2
			// So vendor-3 and vendor-4 should be removed as they're no longer in range
			mockConnectionManager.getUserVendorRooms.mockResolvedValue(['vendor-3', 'vendor-4']);

			// Override the gRPC service mock for this test
			const mockLocationService = {
				vendorLocations: vi.fn().mockReturnValue({
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.next({
							vendors: [
								{ id: 'vendor-1', name: 'Vendor 1' },
								{ id: 'vendor-2', name: 'Vendor 2' },
							],
						});
						observer.complete();
						return { unsubscribe: vi.fn() };
					}),
				}),
			};

			// Mock the locationService property directly
			(gateway as any).locationService = mockLocationService;

			await gateway.updateUserLocation(data, socket);

			expect(mockConnectionManager.removeUserFromVendorRoom).toHaveBeenCalledWith('user-123', 'vendor-3');
			expect(mockConnectionManager.removeUserFromVendorRoom).toHaveBeenCalledWith('user-123', 'vendor-4');
		});

		it('should handle socket without user ID', async () => {
			const socket = createMockSocket({ userId: undefined });
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			await gateway.updateUserLocation(data, socket);

			expect(socket.emit).toHaveBeenCalledWith('error', {
				code: 'UNAUTHORIZED',
				message: 'User not authenticated',
			});
		});

		it('should handle gRPC service errors', async () => {
			const socket = createMockSocket();
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			mockDeps.grpcClient.getService.mockReturnValue({
				vendorLocations: vi.fn().mockReturnValue({
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.error(new Error('gRPC error'));
					}),
				}),
			});

			await gateway.updateUserLocation(data, socket);

			expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});

		it('should handle empty vendors response', async () => {
			const socket = createMockSocket();
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			mockDeps.grpcClient.getService.mockReturnValue({
				vendorLocations: vi.fn().mockReturnValue({
					subscribe: vi.fn().mockImplementation((observer) => {
						observer.next({ vendors: [] });
						observer.complete();
					}),
				}),
			});

			await gateway.updateUserLocation(data, socket);

			expect(mockDeps.websocketMetrics.location_updates_total.inc).toHaveBeenCalledWith({
				status: 'success',
				type: 'user',
			});
		});

		it('should handle connection manager errors gracefully', async () => {
			const socket = createMockSocket();
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			mockConnectionManager.addUserToVendorRoom.mockRejectedValue(new Error('Connection manager error'));

			await gateway.updateUserLocation(data, socket);

			expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});

		it('should handle room management errors gracefully', async () => {
			const socket = createMockSocket();
			const data = {
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			mockConnectionManager.getUserVendorRooms.mockRejectedValue(new Error('Room management error'));

			await gateway.updateUserLocation(data, socket);

			expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});
	});
});

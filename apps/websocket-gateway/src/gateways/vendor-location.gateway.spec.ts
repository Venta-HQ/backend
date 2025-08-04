import { vi } from 'vitest';
import { clearMocks, mockGrpcClient } from '../../../../test/helpers/test-utils';
import { VendorLocationGateway } from './vendor-location.gateway';

// Mock the retry utility
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
		return await operation();
	}),
}));

// Mock the proto modules
vi.mock('@app/proto/location', () => ({
	LOCATION_SERVICE_NAME: 'LocationService',
	LocationServiceClient: {},
}));

describe('VendorLocationGateway', () => {
	let gateway: VendorLocationGateway;
	let grpcClient: any;
	let redis: any;
	let connectionManager: any;
	let connectionHealth: any;
	let mockServer: any;
	let mockSocket: any;
	let locationService: any;

	beforeEach(() => {
		grpcClient = mockGrpcClient();
		locationService = {
			updateVendorLocation: vi.fn(),
		};
		grpcClient.getService.mockReturnValue(locationService);

		redis = {
			del: vi.fn(),
			geopos: vi.fn(),
			geosearch: vi.fn(),
			get: vi.fn(),
			set: vi.fn(),
			zadd: vi.fn(),
		};

		connectionManager = {
			handleDisconnect: vi.fn(),
			registerVendor: vi.fn(),
		};

		connectionHealth = {
			recordConnection: vi.fn(),
			recordDisconnection: vi.fn(),
			updateActivity: vi.fn(),
		};

		mockServer = {
			emit: vi.fn(),
		};

		mockSocket = {
			clerkId: 'clerk-123',
			emit: vi.fn(),
			id: 'socket-123',
			on: vi.fn(),
			to: vi.fn().mockReturnValue({
				emit: vi.fn(),
			}),
			vendorId: 'vendor-123',
		};

		gateway = new VendorLocationGateway(grpcClient, redis, connectionManager, connectionHealth);
		gateway.server = mockServer;
		gateway.afterInit(); // Initialize the location service
	});

	afterEach(() => {
		clearMocks();
	});

	describe('afterInit', () => {
		it('should initialize location service', () => {
			gateway.afterInit();

			expect(grpcClient.getService).toHaveBeenCalledWith('LocationService');
		});
	});

	describe('handleConnection', () => {
		it('should handle vendor connection successfully', async () => {
			await gateway.handleConnection(mockSocket);

			expect(connectionHealth.recordConnection).toHaveBeenCalledWith('socket-123', undefined, 'vendor-123');
			expect(mockSocket.on).toHaveBeenCalledWith('register-vendor', expect.any(Function));
		});

		it('should handle register-vendor event', async () => {
			await gateway.handleConnection(mockSocket);

			// Get the register-vendor event handler
			const registerHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'register-vendor')[1];

			await registerHandler({ vendorId: 'vendor-456' });

			expect(connectionManager.registerVendor).toHaveBeenCalledWith('vendor-456', 'socket-123');
		});

		it('should handle connection health errors gracefully', async () => {
			const healthError = new Error('Health service error');
			connectionHealth.recordConnection.mockRejectedValue(healthError);

			// Should throw when health service fails
			await expect(gateway.handleConnection(mockSocket)).rejects.toThrow('Health service error');
		});
	});

	describe('handleDisconnect', () => {
		it('should handle vendor disconnection successfully', async () => {
			await gateway.handleDisconnect(mockSocket);

			expect(connectionHealth.recordDisconnection).toHaveBeenCalledWith('socket-123');
			expect(connectionManager.handleDisconnect).toHaveBeenCalledWith('socket-123');
		});

		it('should handle disconnection errors gracefully', async () => {
			const disconnectError = new Error('Disconnect error');
			connectionManager.handleDisconnect.mockRejectedValue(disconnectError);

			// Should throw when disconnect fails
			await expect(gateway.handleDisconnect(mockSocket)).rejects.toThrow('Disconnect error');
		});
	});

	describe('updateVendorLocation', () => {
		const locationData = {
			lat: 40.7128,
			long: -74.006,
		};

		beforeEach(() => {
			locationService.updateVendorLocation.mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.next();
					return { unsubscribe: vi.fn() };
				}),
			});
			redis.zadd.mockResolvedValue(1);
			connectionHealth.updateActivity.mockResolvedValue(undefined);
		});

		it('should update vendor location successfully', async () => {
			await gateway.updateVendorLocation(locationData, mockSocket);

			expect(connectionHealth.updateActivity).toHaveBeenCalledWith('socket-123');
			expect(locationService.updateVendorLocation).toHaveBeenCalledWith({
				entityId: 'vendor-123',
				location: {
					lat: 40.7128,
					long: -74.006,
				},
			});
			expect(redis.zadd).toHaveBeenCalledWith('vendor_locations', 40.7128, 'vendor-123');
			expect(mockSocket.to).toHaveBeenCalledWith('vendor-123');
			expect(mockSocket.to().emit).toHaveBeenCalledWith('vendor_sync', {
				id: 'vendor-123',
				location: {
					lat: 40.7128,
					long: -74.006,
				},
			});
		});

		it('should handle socket without vendor ID', async () => {
			const socketWithoutVendor = { ...mockSocket, vendorId: undefined };

			await gateway.updateVendorLocation(locationData, socketWithoutVendor);

			expect(socketWithoutVendor.emit).toHaveBeenCalledWith('error', {
				code: 'UNAUTHORIZED',
				message: 'Vendor not authenticated',
			});
		});

		it('should handle gRPC service errors', async () => {
			locationService.updateVendorLocation.mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.error(new Error('gRPC service error'));
					return { unsubscribe: vi.fn() };
				}),
			});

			await gateway.updateVendorLocation(locationData, mockSocket);

			// Should still continue with Redis update and notification
			expect(redis.zadd).toHaveBeenCalledWith('vendor_locations', 40.7128, 'vendor-123');
			expect(mockSocket.to().emit).toHaveBeenCalledWith('vendor_sync', {
				id: 'vendor-123',
				location: {
					lat: 40.7128,
					long: -74.006,
				},
			});
		});

		it('should handle Redis errors gracefully', async () => {
			const redisError = new Error('Redis connection failed');
			redis.zadd.mockRejectedValue(redisError);

			await gateway.updateVendorLocation(locationData, mockSocket);

			expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});

		it('should handle connection health errors gracefully', async () => {
			const healthError = new Error('Health service error');
			connectionHealth.updateActivity.mockRejectedValue(healthError);

			// Should throw when health service fails
			await expect(gateway.updateVendorLocation(locationData, mockSocket)).rejects.toThrow('Health service error');
		});

		it('should handle gRPC subscription errors', async () => {
			const subscriptionError = new Error('Subscription error');
			locationService.updateVendorLocation.mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.error(subscriptionError);
					return { unsubscribe: vi.fn() };
				}),
			});

			await gateway.updateVendorLocation(locationData, mockSocket);

			// Should still continue with Redis update and notification
			expect(redis.zadd).toHaveBeenCalledWith('vendor_locations', 40.7128, 'vendor-123');
			expect(mockSocket.to().emit).toHaveBeenCalledWith('vendor_sync', {
				id: 'vendor-123',
				location: {
					lat: 40.7128,
					long: -74.006,
				},
			});
		});

		it('should handle successful gRPC subscription', async () => {
			locationService.updateVendorLocation.mockReturnValue({
				subscribe: vi.fn().mockImplementation((observer) => {
					observer.next();
					return { unsubscribe: vi.fn() };
				}),
			});

			await gateway.updateVendorLocation(locationData, mockSocket);

			expect(redis.zadd).toHaveBeenCalledWith('vendor_locations', 40.7128, 'vendor-123');
			expect(mockSocket.to().emit).toHaveBeenCalledWith('vendor_sync', {
				id: 'vendor-123',
				location: {
					lat: 40.7128,
					long: -74.006,
				},
			});
		});
	});
});

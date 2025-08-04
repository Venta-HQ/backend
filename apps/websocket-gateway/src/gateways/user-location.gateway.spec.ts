import { Server, Socket } from 'socket.io';
import { vi } from 'vitest';
import * as retryUtil from '@app/utils';
import { clearMocks, data, errors, grpc, mockGrpcClient } from '../../../../test/helpers/test-utils';
import { UserLocationGateway } from './user-location.gateway';

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

describe('UserLocationGateway', () => {
	let gateway: UserLocationGateway;
	let grpcClient: any;
	let redis: any;
	let connectionManager: any;
	let connectionHealth: any;
	let mockServer: any;
	let mockSocket: any;
	let locationService: any;

	beforeEach(() => {
		grpcClient = mockGrpcClient();
		const mockVendors = [
			{ id: 'vendor-1', location: { lat: 40.7128, long: -74.006 } },
			{ id: 'vendor-2', location: { lat: 40.7589, long: -73.9851 } },
		];

		locationService = {
			vendorLocations: vi.fn(),
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
			addUserToVendorRoom: vi.fn(),
			getUserVendorRooms: vi.fn(),
			handleDisconnect: vi.fn(),
			registerUser: vi.fn(),
			removeUserFromVendorRoom: vi.fn(),
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
			join: vi.fn(),
			leave: vi.fn(),
			on: vi.fn(),
			userId: 'user-123',
		};

		gateway = new UserLocationGateway(grpcClient, redis, connectionManager, connectionHealth);
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
		it('should handle user connection successfully', async () => {
			await gateway.handleConnection(mockSocket);

			expect(connectionHealth.recordConnection).toHaveBeenCalledWith('socket-123', 'user-123');
			expect(mockSocket.on).toHaveBeenCalledWith('register-user', expect.any(Function));
		});

		it('should handle register-user event', async () => {
			await gateway.handleConnection(mockSocket);

			// Get the register-user event handler
			const registerHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'register-user')[1];

			await registerHandler({ userId: 'user-456' });

			expect(connectionManager.registerUser).toHaveBeenCalledWith('user-456', 'socket-123');
		});

		it('should handle connection health errors gracefully', async () => {
			const healthError = new Error('Health service error');
			connectionHealth.recordConnection.mockRejectedValue(healthError);

			// Should throw when health service fails
			await expect(gateway.handleConnection(mockSocket)).rejects.toThrow('Health service error');
		});
	});

	describe('handleDisconnect', () => {
		it('should handle user disconnection successfully', async () => {
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

	describe('updateUserLocation', () => {
		const locationData = {
			neLocation: { lat: 40.7589, long: -73.9851 },
			swLocation: { lat: 40.7505, long: -73.9934 },
		};

		const mockVendors = [
			{ id: 'vendor-1', name: 'Vendor 1' },
			{ id: 'vendor-2', name: 'Vendor 2' },
		];

		beforeEach(() => {
			locationService.vendorLocations.mockReturnValue(grpc.observable({ vendors: mockVendors }));
			connectionManager.getUserVendorRooms.mockResolvedValue(['vendor-1']);
			connectionHealth.updateActivity.mockResolvedValue(undefined);
		});

		it('should update user location successfully', async () => {
			await gateway.updateUserLocation(locationData, mockSocket);

			expect(connectionHealth.updateActivity).toHaveBeenCalledWith('socket-123');
			expect(locationService.vendorLocations).toHaveBeenCalledWith({
				neLocation: { lat: 40.7589, long: -73.9851 },
				swLocation: { lat: 40.7505, long: -73.9934 },
			});
			expect(connectionManager.getUserVendorRooms).toHaveBeenCalledWith('user-123');
			expect(mockSocket.emit).toHaveBeenCalledWith('vendor_channels', mockVendors);
		});

		it('should handle user joining new vendor rooms', async () => {
			connectionManager.getUserVendorRooms.mockResolvedValue(['vendor-1']);
			connectionManager.addUserToVendorRoom.mockResolvedValue(undefined);

			await gateway.updateUserLocation(locationData, mockSocket);

			expect(connectionManager.addUserToVendorRoom).toHaveBeenCalledWith('user-123', 'vendor-2');
			expect(mockSocket.join).toHaveBeenCalledWith('vendor-2');
		});

		it('should handle user leaving vendor rooms', async () => {
			connectionManager.getUserVendorRooms.mockResolvedValue(['vendor-1', 'vendor-3']);
			connectionManager.removeUserFromVendorRoom.mockResolvedValue(undefined);

			await gateway.updateUserLocation(locationData, mockSocket);

			expect(connectionManager.removeUserFromVendorRoom).toHaveBeenCalledWith('user-123', 'vendor-3');
			expect(mockSocket.leave).toHaveBeenCalledWith('vendor-3');
		});

		it('should handle socket without user ID', async () => {
			const socketWithoutUser = { ...mockSocket, userId: undefined };

			await gateway.updateUserLocation(locationData, socketWithoutUser);

			expect(socketWithoutUser.emit).toHaveBeenCalledWith('error', {
				code: 'UNAUTHORIZED',
				message: 'User not authenticated',
			});
		});

		it('should handle gRPC service errors', async () => {
			const grpcError = new Error('gRPC service error');
			locationService.vendorLocations.mockReturnValue(grpc.error(grpcError));

			await gateway.updateUserLocation(locationData, mockSocket);

			expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});

		it('should handle empty vendors response', async () => {
			locationService.vendorLocations.mockReturnValue(grpc.observable({ vendors: [] }));
			connectionManager.getUserVendorRooms.mockResolvedValue(['vendor-1']);

			await gateway.updateUserLocation(locationData, mockSocket);

			expect(connectionManager.removeUserFromVendorRoom).toHaveBeenCalledWith('user-123', 'vendor-1');
			expect(mockSocket.leave).toHaveBeenCalledWith('vendor-1');
			expect(mockSocket.emit).toHaveBeenCalledWith('vendor_channels', []);
		});

		it('should handle connection manager errors gracefully', async () => {
			const managerError = new Error('Connection manager error');
			connectionManager.getUserVendorRooms.mockRejectedValue(managerError);

			await gateway.updateUserLocation(locationData, mockSocket);

			expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});

		it('should handle room management errors gracefully', async () => {
			const roomError = new Error('Room management error');
			connectionManager.addUserToVendorRoom.mockRejectedValue(roomError);

			await gateway.updateUserLocation(locationData, mockSocket);

			expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update location' });
		});
	});
});

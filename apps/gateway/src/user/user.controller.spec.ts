import { vi } from 'vitest';
import { grpc, mockGrpcClient, mockRequest } from '../../../../test/helpers/test-utils';
import { UserController } from './user.controller';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/user', () => ({
	USER_SERVICE_NAME: 'UserService',
	UserVendorData: vi.fn(),
	UserVendorsResponse: vi.fn(),
}));

describe('UserController', () => {
	let controller: UserController;
	let grpcClient: any;

	beforeEach(() => {
		grpcClient = mockGrpcClient();
		controller = new UserController(grpcClient);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getUserVendors', () => {
		it('should return user vendors successfully', async () => {
			const mockRequestObj = mockRequest({
				userId: 'user_123',
			});

			const mockResponse = {
				vendors: [
					{ id: 'vendor_1', name: 'Test Vendor 1' },
					{ id: 'vendor_2', name: 'Test Vendor 2' },
				],
			};

			grpcClient.invoke.mockReturnValue(grpc.success(mockResponse));

			const result = await controller.getUserVendors(mockRequestObj);

			expect(result).toEqual(mockResponse);
			expect(grpcClient.invoke).toHaveBeenCalledWith('getUserVendors', {
				userId: 'user_123',
			});
		});

		it('should handle gRPC errors properly', async () => {
			const mockRequestObj = mockRequest({
				userId: 'user_123',
			});

			const mockError = new Error('Database error');

			grpcClient.invoke.mockReturnValue(grpc.error(mockError));

			await expect(controller.getUserVendors(mockRequestObj)).rejects.toThrow(mockError);
			expect(grpcClient.invoke).toHaveBeenCalledWith('getUserVendors', {
				userId: 'user_123',
			});
		});

		it('should handle empty user vendors response', async () => {
			const mockRequestObj = mockRequest({
				userId: 'user_123',
			});

			const mockResponse = {
				vendors: [],
			};

			grpcClient.invoke.mockReturnValue(grpc.success(mockResponse));

			const result = await controller.getUserVendors(mockRequestObj);

			expect(result).toEqual(mockResponse);
			expect(result.vendors).toHaveLength(0);
		});

		it('should handle missing userId in request', async () => {
			const mockRequestObj = mockRequest({
				userId: undefined,
			});

			const mockResponse = {
				vendors: [],
			};

			grpcClient.invoke.mockReturnValue(grpc.success(mockResponse));

			const result = await controller.getUserVendors(mockRequestObj);

			expect(result).toEqual(mockResponse);
			expect(grpcClient.invoke).toHaveBeenCalledWith('getUserVendors', {
				userId: undefined,
			});
		});
	});
});

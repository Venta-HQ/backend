import { vi } from 'vitest';
import { createGrpcErrorTest, createGrpcSuccessTest, grpc, mockGrpcClient, mockRequest } from '../../../../test/helpers/test-utils';
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
		const mockRequestObj = mockRequest({ userId: 'user_123' });
		const mockResponse = {
			vendors: [
				{ id: 'vendor_1', name: 'Test Vendor 1' },
				{ id: 'vendor_2', name: 'Test Vendor 2' },
			],
		};
		const expectedGrpcCall = { userId: 'user_123' };

		it('should return user vendors successfully', async () => {
			const test = createGrpcSuccessTest(
				controller,
				'getUserVendors',
				grpcClient,
				'getUserVendors',
				mockRequestObj,
				mockResponse,
				expectedGrpcCall
			);
			await test();
		});

		it('should handle gRPC errors properly', async () => {
			const mockError = new Error('Database error');
			const test = createGrpcErrorTest(
				controller,
				'getUserVendors',
				grpcClient,
				'getUserVendors',
				mockRequestObj,
				mockError,
				expectedGrpcCall
			);
			await test();
		});

		it('should handle empty user vendors response', async () => {
			const emptyResponse = { vendors: [] };
			const test = createGrpcSuccessTest(
				controller,
				'getUserVendors',
				grpcClient,
				'getUserVendors',
				mockRequestObj,
				emptyResponse,
				expectedGrpcCall
			);
			await test();
		});

		it('should handle missing userId in request', async () => {
			const requestWithoutUserId = mockRequest({ userId: undefined });
			const emptyResponse = { vendors: [] };
			const expectedCallWithoutUserId = { userId: undefined };
			
			const test = createGrpcSuccessTest(
				controller,
				'getUserVendors',
				grpcClient,
				'getUserVendors',
				requestWithoutUserId,
				emptyResponse,
				expectedCallWithoutUserId
			);
			await test();
		});
	});
});

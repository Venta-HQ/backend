import { 
  grpcControllerTesting,
  createGrpcObservableResolved,
  createGrpcObservableRejected,
  createMockRequest
} from '../../../../test/helpers';
import { vi } from 'vitest';
import { UserController } from './user.controller';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/user', () => ({
  USER_SERVICE_NAME: 'UserService',
  UserVendorData: vi.fn(),
  UserVendorsResponse: vi.fn(),
}));

describe('UserController', () => {
  let controller: UserController;
  let mockGrpcClient: any;

  beforeEach(() => {
    const test = grpcControllerTesting.createTest(UserController);
    controller = test.controller;
    mockGrpcClient = test.mockGrpcClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserVendors', () => {
    it('should return user vendors successfully', async () => {
      const mockRequest = createMockRequest({
        userId: 'user_123',
      });
      
      const mockResponse = {
        vendors: [
          { id: 'vendor_1', name: 'Test Vendor 1' },
          { id: 'vendor_2', name: 'Test Vendor 2' },
        ],
      };

      mockGrpcClient.invoke.mockReturnValue(createGrpcObservableResolved(mockResponse));

      const result = await controller.getUserVendors(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockGrpcClient.invoke).toHaveBeenCalledWith('getUserVendors', {
        userId: 'user_123',
      });
    });

    it('should handle gRPC errors properly', async () => {
      const mockRequest = createMockRequest({
        userId: 'user_123',
      });
      
      const mockError = new Error('Database error');

      mockGrpcClient.invoke.mockReturnValue(createGrpcObservableRejected(mockError));

      await expect(controller.getUserVendors(mockRequest)).rejects.toThrow(mockError);
      expect(mockGrpcClient.invoke).toHaveBeenCalledWith('getUserVendors', {
        userId: 'user_123',
      });
    });

    it('should handle empty user vendors response', async () => {
      const mockRequest = createMockRequest({
        userId: 'user_123',
      });
      
      const mockResponse = {
        vendors: [],
      };

      mockGrpcClient.invoke.mockReturnValue(createGrpcObservableResolved(mockResponse));

      const result = await controller.getUserVendors(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.vendors).toHaveLength(0);
    });

    it('should handle missing userId in request', async () => {
      const mockRequest = createMockRequest({
        userId: undefined,
      });
      
      const mockResponse = {
        vendors: [],
      };

      mockGrpcClient.invoke.mockReturnValue(createGrpcObservableResolved(mockResponse));

      const result = await controller.getUserVendors(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockGrpcClient.invoke).toHaveBeenCalledWith('getUserVendors', {
        userId: undefined,
      });
    });
  });
}); 
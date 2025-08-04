import { vi } from 'vitest';
import { VendorController } from './vendor.controller';
import { CreateVendorData, UpdateVendorData } from '@app/apitypes';
import { mockGrpcClient, grpc, mockRequest } from '../../../../test/helpers/test-utils';

// Mock the proto imports to avoid module resolution issues
vi.mock('@app/proto/vendor', () => ({
  VENDOR_SERVICE_NAME: 'VendorService',
  Vendor: vi.fn(),
  VendorCreateResponse: vi.fn(),
  VendorUpdateResponse: vi.fn(),
}));

describe('VendorController', () => {
  let controller: VendorController;
  let grpcClient: any;

  beforeEach(() => {
    grpcClient = mockGrpcClient();
    controller = new VendorController(grpcClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getVendorById', () => {
    it('should return vendor by id successfully', async () => {
      const vendorId = 'vendor_123';
      const mockVendor = {
        id: vendorId,
        name: 'Test Vendor',
        description: 'Test Description',
        email: 'test@example.com',
        phone: '123-456-7890',
        website: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
        lat: 40.7128,
        long: -74.0060,
        open: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      grpcClient.invoke.mockReturnValue(grpc.observable(mockVendor));

      const result = await controller.getVendorById(vendorId);

      expect(result).toEqual(mockVendor);
      expect(grpcClient.invoke).toHaveBeenCalledWith('getVendorById', { id: vendorId });
    });

    it('should handle gRPC errors properly', async () => {
      const vendorId = 'vendor_123';
      const mockError = new Error('Vendor not found');

      grpcClient.invoke.mockReturnValue(grpc.observable(mockError));

      await expect(controller.getVendorById(vendorId)).rejects.toThrow(mockError);
      expect(grpcClient.invoke).toHaveBeenCalledWith('getVendorById', { id: vendorId });
    });
  });

  describe('createVendor', () => {
    it('should create vendor successfully', async () => {
      const mockRequestObj = mockRequest({
        userId: 'user_123',
      });

      const createVendorData: CreateVendorData = {
        name: 'New Vendor',
        description: 'New vendor description',
        email: 'new@example.com',
        phone: '123-456-7890',
        website: 'https://newvendor.com',
        imageUrl: 'https://newvendor.com/image.jpg',
      };

      const mockResponse = {
        id: 'new_vendor_123',
        ...createVendorData,
      };

      grpcClient.invoke.mockReturnValue(grpc.observable(mockResponse));

      const result = await controller.createVendor(mockRequestObj, createVendorData);

      expect(result).toEqual(mockResponse);
      expect(grpcClient.invoke).toHaveBeenCalledWith('createVendor', {
        ...createVendorData,
        description: createVendorData.description ?? '',
        email: createVendorData.email ?? '',
        imageUrl: createVendorData.imageUrl ?? '',
        name: createVendorData.name ?? '',
        phone: createVendorData.phone ?? '',
        userId: 'user_123',
        website: createVendorData.website ?? '',
      });
    });

    it('should handle partial vendor data with defaults', async () => {
      const mockRequestObj = mockRequest({
        userId: 'user_123',
      });

      const createVendorData: CreateVendorData = {
        name: 'Partial Vendor',
        // Missing optional fields
      };

      const mockResponse = {
        id: 'partial_vendor_123',
        name: 'Partial Vendor',
        description: '',
        email: '',
        phone: '',
        website: '',
        imageUrl: '',
      };

      grpcClient.invoke.mockReturnValue(grpc.observable(mockResponse));

      const result = await controller.createVendor(mockRequestObj, createVendorData);

      expect(result).toEqual(mockResponse);
      expect(grpcClient.invoke).toHaveBeenCalledWith('createVendor', {
        ...createVendorData,
        description: '',
        email: '',
        imageUrl: '',
        name: 'Partial Vendor',
        phone: '',
        userId: 'user_123',
        website: '',
      });
    });

    it('should handle gRPC errors during creation', async () => {
      const mockRequestObj = mockRequest({
        userId: 'user_123',
      });

      const createVendorData: CreateVendorData = {
        name: 'Error Vendor',
      };

      const mockError = new Error('Creation failed');

      grpcClient.invoke.mockReturnValue(grpc.observable(mockError));

      await expect(controller.createVendor(mockRequestObj, createVendorData)).rejects.toThrow(mockError);
    });
  });

  describe('updateVendor', () => {
    it('should update vendor successfully', async () => {
      const vendorId = 'vendor_123';
      const mockRequestObj = mockRequest({
        userId: 'user_123',
      });

      const updateVendorData: UpdateVendorData = {
        name: 'Updated Vendor',
        description: 'Updated description',
        email: 'updated@example.com',
        phone: '987-654-3210',
        website: 'https://updatedvendor.com',
        imageUrl: 'https://updatedvendor.com/image.jpg',
      };

      const mockResponse = {
        message: 'Vendor updated successfully',
        success: true,
      };

      grpcClient.invoke.mockReturnValue(grpc.observable(mockResponse));

      const result = await controller.updateVendor(vendorId, mockRequestObj, updateVendorData);

      expect(result).toEqual(mockResponse);
      expect(grpcClient.invoke).toHaveBeenCalledWith('updateVendor', {
        ...updateVendorData,
        description: updateVendorData.description ?? '',
        email: updateVendorData.email ?? '',
        id: vendorId,
        imageUrl: updateVendorData.imageUrl ?? '',
        name: updateVendorData.name ?? '',
        phone: updateVendorData.phone ?? '',
        userId: 'user_123',
        website: updateVendorData.website ?? '',
      });
    });

    it('should handle partial update data with defaults', async () => {
      const vendorId = 'vendor_123';
      const mockRequestObj = mockRequest({
        userId: 'user_123',
      });

      const updateVendorData: UpdateVendorData = {
        name: 'Partially Updated Vendor',
        // Missing optional fields
      };

      const mockResponse = {
        message: 'Vendor updated successfully',
        success: true,
      };

      grpcClient.invoke.mockReturnValue(grpc.observable(mockResponse));

      const result = await controller.updateVendor(vendorId, mockRequestObj, updateVendorData);

      expect(result).toEqual(mockResponse);
      expect(grpcClient.invoke).toHaveBeenCalledWith('updateVendor', {
        ...updateVendorData,
        description: '',
        email: '',
        id: vendorId,
        imageUrl: '',
        name: 'Partially Updated Vendor',
        phone: '',
        userId: 'user_123',
        website: '',
      });
    });

    it('should handle gRPC errors during update', async () => {
      const vendorId = 'vendor_123';
      const mockRequestObj = mockRequest({
        userId: 'user_123',
      });

      const updateVendorData: UpdateVendorData = {
        name: 'Error Update Vendor',
      };

      const mockError = new Error('Update failed');

      grpcClient.invoke.mockReturnValue(grpc.observable(mockError));

      await expect(controller.updateVendor(vendorId, mockRequestObj, updateVendorData)).rejects.toThrow(mockError);
    });
  });
}); 
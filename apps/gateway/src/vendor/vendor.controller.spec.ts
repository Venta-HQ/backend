import { vi } from 'vitest';
import { CreateVendorData, UpdateVendorData } from '@app/apitypes';
import {
	createGrpcErrorMock,
	createGrpcSuccessMock,
	mockGrpcClient,
	mockRequest,
} from '../../../../test/helpers/test-utils';
import { VendorController } from './vendor.controller';

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
		const vendorId = 'vendor_123';
		const mockVendor = {
			createdAt: new Date().toISOString(),
			description: 'Test Description',
			email: 'test@example.com',
			id: vendorId,
			imageUrl: 'https://example.com/image.jpg',
			lat: 40.7128,
			long: -74.006,
			name: 'Test Vendor',
			open: true,
			phone: '123-456-7890',
			updatedAt: new Date().toISOString(),
			website: 'https://example.com',
		};

		it('should return vendor by id successfully', async () => {
			grpcClient.invoke.mockReturnValue(createGrpcSuccessMock(mockVendor));

			const result = await controller.getVendorById(vendorId);

			expect(result).toEqual(mockVendor);
			expect(grpcClient.invoke).toHaveBeenCalledWith('getVendorById', { id: vendorId });
		});

		it('should handle gRPC errors properly', async () => {
			const mockError = new Error('Vendor not found');
			grpcClient.invoke.mockReturnValue(createGrpcErrorMock(mockError));

			await expect(controller.getVendorById(vendorId)).rejects.toThrow(mockError);
			expect(grpcClient.invoke).toHaveBeenCalledWith('getVendorById', { id: vendorId });
		});
	});

	describe('createVendor', () => {
		const mockRequestObj = mockRequest({ userId: 'user_123' });
		const createVendorData: CreateVendorData = {
			description: 'New vendor description',
			email: 'new@example.com',
			imageUrl: 'https://newvendor.com/image.jpg',
			name: 'New Vendor',
			phone: '123-456-7890',
			website: 'https://newvendor.com',
		};
		const mockResponse = {
			id: 'new_vendor_123',
			...createVendorData,
		};
		const expectedGrpcCall = {
			...createVendorData,
			description: createVendorData.description ?? '',
			email: createVendorData.email ?? '',
			imageUrl: createVendorData.imageUrl ?? '',
			name: createVendorData.name ?? '',
			phone: createVendorData.phone ?? '',
			userId: 'user_123',
			website: createVendorData.website ?? '',
		};

		it('should create vendor successfully', async () => {
			grpcClient.invoke.mockReturnValue(createGrpcSuccessMock(mockResponse));

			const result = await controller.createVendor(mockRequestObj, createVendorData);

			expect(result).toEqual(mockResponse);
			expect(grpcClient.invoke).toHaveBeenCalledWith('createVendor', expectedGrpcCall);
		});

		it('should handle partial vendor data with defaults', async () => {
			const partialData: CreateVendorData = {
				name: 'Partial Vendor',
				// Missing optional fields
			};
			const partialResponse = {
				description: '',
				email: '',
				id: 'partial_vendor_123',
				imageUrl: '',
				name: 'Partial Vendor',
				phone: '',
				website: '',
			};
			const expectedPartialCall = {
				...partialData,
				description: '',
				email: '',
				imageUrl: '',
				name: 'Partial Vendor',
				phone: '',
				userId: 'user_123',
				website: '',
			};

			grpcClient.invoke.mockReturnValue(createGrpcSuccessMock(partialResponse));

			const result = await controller.createVendor(mockRequestObj, partialData);

			expect(result).toEqual(partialResponse);
			expect(grpcClient.invoke).toHaveBeenCalledWith('createVendor', expectedPartialCall);
		});

		it('should handle gRPC errors during creation', async () => {
			const errorData: CreateVendorData = {
				name: 'Error Vendor',
			};
			const mockError = new Error('Vendor creation failed');
			const expectedErrorCall = {
				...errorData,
				description: '',
				email: '',
				imageUrl: '',
				name: 'Error Vendor',
				phone: '',
				userId: 'user_123',
				website: '',
			};

			grpcClient.invoke.mockReturnValue(createGrpcErrorMock(mockError));

			await expect(controller.createVendor(mockRequestObj, errorData)).rejects.toThrow(mockError);
			expect(grpcClient.invoke).toHaveBeenCalledWith('createVendor', expectedErrorCall);
		});
	});

	describe('updateVendor', () => {
		const mockRequestObj = mockRequest({ userId: 'user_123' });
		const updateVendorData: UpdateVendorData = {
			description: 'Updated vendor description',
			email: 'updated@example.com',
			id: 'vendor_123',
			imageUrl: 'https://updatedvendor.com/image.jpg',
			name: 'Updated Vendor',
			phone: '987-654-3210',
			website: 'https://updatedvendor.com',
		};
		const mockResponse = {
			...updateVendorData,
			updatedAt: new Date().toISOString(),
		};
		const expectedGrpcCall = {
			...updateVendorData,
			description: updateVendorData.description ?? '',
			email: updateVendorData.email ?? '',
			imageUrl: updateVendorData.imageUrl ?? '',
			name: updateVendorData.name ?? '',
			phone: updateVendorData.phone ?? '',
			userId: 'user_123',
			website: updateVendorData.website ?? '',
		};

		it('should update vendor successfully', async () => {
			grpcClient.invoke.mockReturnValue(createGrpcSuccessMock(mockResponse));

			const result = await controller.updateVendor('vendor_123', mockRequestObj, updateVendorData);

			expect(result).toEqual(mockResponse);
			expect(grpcClient.invoke).toHaveBeenCalledWith('updateVendor', expectedGrpcCall);
		});

		it('should handle partial update data with defaults', async () => {
			const partialData: UpdateVendorData = {
				id: 'vendor_123',
				name: 'Partially Updated Vendor',
				// Missing optional fields
			};
			const partialResponse = {
				...partialData,
				description: '',
				email: '',
				imageUrl: '',
				phone: '',
				updatedAt: new Date().toISOString(),
				website: '',
			};
			const expectedPartialCall = {
				...partialData,
				description: '',
				email: '',
				imageUrl: '',
				name: 'Partially Updated Vendor',
				phone: '',
				userId: 'user_123',
				website: '',
			};

			grpcClient.invoke.mockReturnValue(createGrpcSuccessMock(partialResponse));

			const result = await controller.updateVendor('vendor_123', mockRequestObj, partialData);

			expect(result).toEqual(partialResponse);
			expect(grpcClient.invoke).toHaveBeenCalledWith('updateVendor', expectedPartialCall);
		});

		it('should handle gRPC errors during update', async () => {
			const errorData: UpdateVendorData = {
				id: 'vendor_123',
				name: 'Error Vendor',
			};
			const mockError = new Error('Vendor update failed');
			const expectedErrorCall = {
				...errorData,
				description: '',
				email: '',
				imageUrl: '',
				name: 'Error Vendor',
				phone: '',
				userId: 'user_123',
				website: '',
			};

			grpcClient.invoke.mockReturnValue(createGrpcErrorMock(mockError));

			await expect(controller.updateVendor('vendor_123', mockRequestObj, errorData)).rejects.toThrow(mockError);
			expect(grpcClient.invoke).toHaveBeenCalledWith('updateVendor', expectedErrorCall);
		});
	});
});

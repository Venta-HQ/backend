import { vi } from 'vitest';
import { clearMocks, mockRequest } from '../../../test/helpers/test-utils';
import { VendorController } from './vendor.controller';

// Mock the proto modules
vi.mock('@app/proto/vendor', () => ({
	VENDOR_SERVICE_NAME: 'VendorService',
	VendorServiceClient: vi.fn(),
}));

describe('VendorController', () => {
	let controller: VendorController;
	let vendorService: any;

	beforeEach(() => {
		vendorService = {
			createVendor: vi.fn(),
			deleteVendor: vi.fn(),
			getVendorById: vi.fn(),
			updateVendor: vi.fn(),
		};
		controller = new VendorController(vendorService);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('getVendorById', () => {
		it('should return vendor when found', async () => {
			const mockVendor = {
				createdAt: new Date(),
				description: 'A test vendor',
				email: 'test@vendor.com',
				id: 'vendor_123',
				lat: 40.7128,
				long: -74.006,
				name: 'Test Vendor',
				open: true,
				phone: '123-456-7890',
				primaryImage: 'https://example.com/image.jpg',
				updatedAt: new Date(),
				website: 'https://testvendor.com',
			};
			vendorService.getVendorById.mockResolvedValue(mockVendor);

			const request = mockRequest({ id: 'vendor_123' });
			const result = await controller.getVendorById(request);

			expect(vendorService.getVendorById).toHaveBeenCalledWith('vendor_123');
			expect(result).toEqual(mockVendor);
		});

		it('should return null when vendor not found', async () => {
			vendorService.getVendorById.mockResolvedValue(null);

			const request = mockRequest({ id: 'vendor_123' });
			const result = await controller.getVendorById(request);

			expect(result).toBeNull();
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			vendorService.getVendorById.mockRejectedValue(serviceError);

			const request = mockRequest({ id: 'vendor_123' });

			await expect(controller.getVendorById(request)).rejects.toThrow('Service error');
		});
	});

	describe('createVendor', () => {
		const createData = {
			description: 'A test vendor',
			email: 'test@vendor.com',
			imageUrl: 'https://example.com/image.jpg',
			name: 'Test Vendor',
			phone: '123-456-7890',
			userId: 'user_123',
			website: 'https://testvendor.com',
		};

		it('should create vendor successfully', async () => {
			vendorService.createVendor.mockResolvedValue('vendor_123');

			const request = mockRequest(createData);
			const result = await controller.createVendor(request);

			expect(vendorService.createVendor).toHaveBeenCalledWith(createData);
			expect(result).toEqual({ id: 'vendor_123' });
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			vendorService.createVendor.mockRejectedValue(serviceError);

			const request = mockRequest(createData);

			await expect(controller.createVendor(request)).rejects.toThrow('Service error');
		});
	});

	describe('updateVendor', () => {
		const updateData = {
			description: 'An updated vendor',
			email: 'updated@vendor.com',
			id: 'vendor_123',
			imageUrl: 'https://example.com/updated-image.jpg',
			name: 'Updated Vendor',
			phone: '987-654-3210',
			userId: 'user_123',
			website: 'https://updatedvendor.com',
		};

		it('should update vendor successfully', async () => {
			vendorService.updateVendor.mockResolvedValue(undefined);

			const request = mockRequest(updateData);
			const result = await controller.updateVendor(request);

			expect(vendorService.updateVendor).toHaveBeenCalledWith('vendor_123', 'user_123', {
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				imageUrl: 'https://example.com/updated-image.jpg',
				name: 'Updated Vendor',
				phone: '987-654-3210',
				website: 'https://updatedvendor.com',
			});
			expect(result).toEqual({});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			vendorService.updateVendor.mockRejectedValue(serviceError);

			const request = mockRequest(updateData);

			await expect(controller.updateVendor(request)).rejects.toThrow('Service error');
		});
	});

	describe('deleteVendor', () => {
		const deleteData = {
			id: 'vendor_123',
			userId: 'user_123',
		};

		it('should delete vendor successfully', async () => {
			vendorService.deleteVendor.mockResolvedValue(undefined);

			const request = mockRequest(deleteData);
			const result = await controller.deleteVendor(request);

			expect(vendorService.deleteVendor).toHaveBeenCalledWith('vendor_123', 'user_123');
			expect(result).toEqual({});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			vendorService.deleteVendor.mockRejectedValue(serviceError);

			const request = mockRequest(deleteData);

			await expect(controller.deleteVendor(request)).rejects.toThrow('Service error');
		});
	});
});

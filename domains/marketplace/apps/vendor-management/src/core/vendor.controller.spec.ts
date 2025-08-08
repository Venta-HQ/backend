import { vi } from 'vitest';
import { VendorController } from './vendor.controller';

// Simple clearMocks function
const clearMocks = () => {
	vi.clearAllMocks();
};

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
			onboardVendor: vi.fn(),
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

			const result = await controller.getVendorById({ id: 'vendor_123' });

			expect(vendorService.getVendorById).toHaveBeenCalledWith('vendor_123');
			expect(result).toEqual({
				vendor: {
					createdAt: mockVendor.createdAt.toISOString(),
					description: 'A test vendor',
					email: 'test@vendor.com',
					id: 'vendor_123',
					location: {
						lat: 40.7128,
						long: -74.006,
					},
					name: 'Test Vendor',
					open: true,
					phone: '123-456-7890',
					primaryImage: 'https://example.com/image.jpg',
					updatedAt: mockVendor.updatedAt.toISOString(),
					website: 'https://testvendor.com',
				},
			});
		});

		it('should return undefined vendor when not found', async () => {
			vendorService.getVendorById.mockResolvedValue(null);

			const result = await controller.getVendorById({ id: 'vendor_123' });

			expect(result).toEqual({ vendor: undefined });
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			vendorService.getVendorById.mockRejectedValue(serviceError);

			await expect(controller.getVendorById({ id: 'vendor_123' })).rejects.toThrow();
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
			vendorService.onboardVendor.mockResolvedValue('vendor_123');

			const result = await controller.createVendor(createData);

			expect(vendorService.onboardVendor).toHaveBeenCalledWith({
				description: 'A test vendor',
				email: 'test@vendor.com',
				name: 'Test Vendor',
				ownerId: 'user_123',
				phone: '123-456-7890',
				primaryImage: 'https://example.com/image.jpg',
				website: 'https://testvendor.com',
			});
			expect(result).toEqual({ id: 'vendor_123' });
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			vendorService.onboardVendor.mockRejectedValue(serviceError);

			await expect(controller.createVendor(createData)).rejects.toThrow();
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

			const result = await controller.updateVendor(updateData);

			expect(vendorService.updateVendor).toHaveBeenCalledWith('vendor_123', {
				description: 'An updated vendor',
				email: 'updated@vendor.com',
				name: 'Updated Vendor',
				phone: '987-654-3210',
				primaryImage: 'https://example.com/updated-image.jpg',
				website: 'https://updatedvendor.com',
			});
			expect(result).toEqual({ message: 'Vendor updated successfully', success: true });
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			vendorService.updateVendor.mockRejectedValue(serviceError);

			await expect(controller.updateVendor(updateData)).rejects.toThrow();
		});
	});
});

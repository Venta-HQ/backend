import { vi } from 'vitest';
import { VendorController } from './vendor.controller';

// Mock the proto imports to avoid module resolution issues
vi.mock('@venta/proto/user', () => ({
	USER_SERVICE_NAME: 'UserService',
	UserVendorData: vi.fn(),
	UserVendorsResponse: vi.fn(),
}));

describe('VendorController', () => {
	let controller: VendorController;
	let mockVendorService: any;

	beforeEach(() => {
		mockVendorService = {
			getUserVendors: vi.fn(),
		};
		controller = new VendorController(mockVendorService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getUserVendors', () => {
		it('should return user vendors successfully', async () => {
			const mockData = { userId: 'user_123' };

			const mockVendors = [
				{ id: 'vendor_1', name: 'Test Vendor 1' },
				{ id: 'vendor_2', name: 'Test Vendor 2' },
			];

			mockVendorService.getUserVendors.mockResolvedValue(mockVendors);

			const result = await controller.getUserVendors(mockData);

			expect(result).toEqual({ vendors: mockVendors });
			expect(mockVendorService.getUserVendors).toHaveBeenCalledWith('user_123');
		});

		it('should handle empty vendors list', async () => {
			const mockData = { userId: 'user_123' };

			mockVendorService.getUserVendors.mockResolvedValue([]);

			const result = await controller.getUserVendors(mockData);

			expect(result).toEqual({ vendors: [] });
			expect(result.vendors).toHaveLength(0);
		});

		it('should handle service errors', async () => {
			const mockData = { userId: 'user_123' };

			const mockError = new Error('Service error');
			mockVendorService.getUserVendors.mockRejectedValue(mockError);

			await expect(controller.getUserVendors(mockData)).rejects.toThrow(mockError);
			expect(mockVendorService.getUserVendors).toHaveBeenCalledWith('user_123');
		});
	});
});

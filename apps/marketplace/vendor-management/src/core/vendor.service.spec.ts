import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorService } from './vendor.service';

// Simple mock functions
const clearMocks = () => {
	vi.clearAllMocks();
};

const data = {
	vendor: (overrides = {}) => ({
		id: 'vendor-123',
		name: 'Test Vendor',
		description: 'A test vendor',
		email: 'test@vendor.com',
		phone: '123-456-7890',
		website: 'https://testvendor.com',
		primaryImage: 'https://example.com/image.jpg',
		lat: 40.7128,
		long: -74.006,
		open: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),
};

const errors = {
	VendorDomainError: class VendorDomainError extends Error {
		constructor(message: string) {
			super(message);
			this.name = 'VendorDomainError';
		}
	},
};

const mockPrisma = {
	db: {
		vendor: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
};

describe('VendorService', () => {
	let service: VendorService;
	let mockEventService: any;
	let mockLogger: any;

	beforeEach(() => {
		mockEventService = {
			emit: vi.fn(),
		};
		mockLogger = {
			log: vi.fn(),
			error: vi.fn(),
		};
		service = new VendorService(mockPrisma as any, mockEventService, mockLogger);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('onboardVendor', () => {
		it('should onboard vendor successfully', async () => {
			const onboardingData = data.vendor();
			const createdVendor = { ...onboardingData, id: 'vendor-123' };
			mockPrisma.db.vendor.create.mockResolvedValue(createdVendor);

			const result = await service.onboardVendor(onboardingData);

			expect(mockPrisma.db.vendor.create).toHaveBeenCalledWith({
				data: {
					description: onboardingData.description || '',
					email: onboardingData.email || '',
					name: onboardingData.name,
					ownerId: onboardingData.ownerId,
					phone: onboardingData.phone || '',
					primaryImage: onboardingData.primaryImage || '',
					website: onboardingData.website || '',
				},
			});
			expect(mockEventService.emit).toHaveBeenCalledWith('marketplace.vendor_onboarded', {
				vendorId: 'vendor-123',
				ownerId: onboardingData.ownerId,
				location: {
					lat: 0,
					lng: 0,
				},
			});
			expect(result).toBe('vendor-123');
		});

		it('should handle validation errors', async () => {
			const onboardingData = data.vendor({ lat: 100 }); // Invalid latitude
			mockPrisma.db.vendor.create.mockRejectedValue(new Error('Validation failed'));

			await expect(service.onboardVendor(onboardingData)).rejects.toThrow();
		});
	});

	describe('updateVendor', () => {
		it('should update vendor successfully', async () => {
			const vendorId = 'vendor-123';
			const updateData = { name: 'Updated Vendor' };
			const updatedVendor = data.vendor({ ...updateData, id: vendorId });
			mockPrisma.db.vendor.update.mockResolvedValue(updatedVendor);

			const result = await service.updateVendor(vendorId, updateData);

			expect(mockPrisma.db.vendor.update).toHaveBeenCalledWith({
				where: { id: vendorId },
				data: updateData,
			});
			expect(mockEventService.emit).toHaveBeenCalledWith('marketplace.vendor_profile_updated', {
				vendorId,
				updatedFields: ['name'],
			});
			expect(result).toEqual(updatedVendor);
		});
	});

	describe('getVendorById', () => {
		it('should return vendor when found', async () => {
			const vendorId = 'vendor-123';
			const vendor = data.vendor({ id: vendorId });
			mockPrisma.db.vendor.findUnique.mockResolvedValue(vendor);

			const result = await service.getVendorById(vendorId);

			expect(mockPrisma.db.vendor.findUnique).toHaveBeenCalledWith({
				where: { id: vendorId },
			});
			expect(result).toEqual(vendor);
		});

		it('should return null when vendor not found', async () => {
			const vendorId = 'vendor-123';
			mockPrisma.db.vendor.findUnique.mockResolvedValue(null);

			const result = await service.getVendorById(vendorId);

			expect(mockPrisma.db.vendor.findUnique).toHaveBeenCalledWith({
				where: { id: vendorId },
			});
			expect(result).toBeNull();
		});
	});
});

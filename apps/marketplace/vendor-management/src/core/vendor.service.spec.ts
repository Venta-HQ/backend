import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorDomainError } from '@app/nest/errors/domain-errors';
import { clearMocks, data, errors, mockPrisma } from '../../../../../test/helpers/test-utils';
import { VendorService } from './vendor.service';

// Mock the retry utility
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
		return await operation();
	}),
}));

describe('VendorService', () => {
	let service: VendorService;
	let prisma: any;
	let eventService: any;

	beforeEach(() => {
		prisma = mockPrisma();
		// Add missing user table methods
		prisma.db.user = {
			findUnique: vi.fn(),
		};
		eventService = {
			emit: vi.fn(),
		};
		service = new VendorService(prisma, eventService);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('getVendorById', () => {
		it('should return vendor when found', async () => {
			const mockVendor = data.vendor({ id: 'vendor_123' });
			prisma.db.vendor.findFirst.mockResolvedValue(mockVendor);

			const result = await service.getVendorById('vendor_123');

			expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
				where: { id: 'vendor_123' },
			});
			expect(result).toEqual(mockVendor);
		});

		it('should return null when vendor not found', async () => {
			prisma.db.vendor.findFirst.mockResolvedValue(null);

			const result = await service.getVendorById('vendor_123');

			expect(result).toBeNull();
		});

		it('should handle database errors', async () => {
			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.findFirst.mockRejectedValue(dbError);

			await expect(service.getVendorById('vendor_123')).rejects.toThrow(VendorDomainError);
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
			// Mock user exists validation
			prisma.db.user.findUnique.mockResolvedValue({ clerkId: 'clerk-123', id: 'user_123' });

			const { imageUrl, ...vendorData } = data.vendor({ id: 'vendor_123' });
			const mockVendor = {
				...vendorData,
				description: createData.description,
				email: createData.email,
				name: createData.name,
				phone: createData.phone,
				primaryImage: createData.imageUrl,
				website: createData.website,
			};
			prisma.db.vendor.create.mockResolvedValue(mockVendor);

			const result = await service.createVendor(createData);

			expect(prisma.db.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user_123' },
			});
			expect(prisma.db.vendor.create).toHaveBeenCalledWith({
				data: {
					description: 'A test vendor',
					email: 'test@vendor.com',
					name: 'Test Vendor',
					ownerId: 'user_123',
					phone: '123-456-7890',
					primaryImage: 'https://example.com/image.jpg',
					website: 'https://testvendor.com',
				},
			});
			expect(eventService.emit).toHaveBeenCalledWith('vendor.created', mockVendor);
			expect(result).toBe('vendor_123');
		});

		it('should create vendor without imageUrl', async () => {
			// Mock user exists validation
			prisma.db.user.findUnique.mockResolvedValue({ clerkId: 'clerk-123', id: 'user_123' });

			const createDataWithoutImage = { ...createData };
			delete createDataWithoutImage.imageUrl;
			const mockVendor = data.vendor({ id: 'vendor_123' });
			prisma.db.vendor.create.mockResolvedValue(mockVendor);

			const result = await service.createVendor(createDataWithoutImage);

			expect(prisma.db.vendor.create).toHaveBeenCalledWith({
				data: {
					description: 'A test vendor',
					email: 'test@vendor.com',
					name: 'Test Vendor',
					ownerId: 'user_123',
					phone: '123-456-7890',
					website: 'https://testvendor.com',
				},
			});
			expect(result).toBe('vendor_123');
		});

		it('should handle database errors', async () => {
			// Mock user exists validation
			prisma.db.user.findUnique.mockResolvedValue({ clerkId: 'clerk-123', id: 'user_123' });

			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.create.mockRejectedValue(dbError);

			await expect(service.createVendor(createData)).rejects.toThrow(VendorDomainError);
		});

		it('should throw error when user does not exist', async () => {
			prisma.db.user.findUnique.mockResolvedValue(null);

			await expect(service.createVendor(createData)).rejects.toThrow(VendorDomainError);
		});

		it('should throw error when vendor name is empty', async () => {
			// Mock user exists validation
			prisma.db.user.findUnique.mockResolvedValue({ clerkId: 'clerk-123', id: 'user_123' });

			const invalidData = { ...createData, name: '' };

			await expect(service.createVendor(invalidData)).rejects.toThrow(VendorDomainError);
		});
	});

	describe('updateVendor', () => {
		const updateData = {
			description: 'Updated vendor description',
			email: 'updated@vendor.com',
			imageUrl: 'https://example.com/updated-image.jpg',
			name: 'Updated Vendor',
			phone: '987-654-3210',
			website: 'https://updatedvendor.com',
		};

		it('should update vendor successfully', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });
			// Mock vendor ownership validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });

			const mockVendor = data.vendor({ id: 'vendor_123' });
			prisma.db.vendor.update.mockResolvedValue(mockVendor);

			await service.updateVendor('vendor_123', 'user_123', updateData);

			expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
				where: { id: 'vendor_123' },
			});
			expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
			expect(prisma.db.vendor.update).toHaveBeenCalledWith({
				data: {
					description: 'Updated vendor description',
					email: 'updated@vendor.com',
					name: 'Updated Vendor',
					phone: '987-654-3210',
					primaryImage: 'https://example.com/updated-image.jpg',
					website: 'https://updatedvendor.com',
				},
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
			expect(eventService.emit).toHaveBeenCalledWith('vendor.updated', mockVendor);
		});

		it('should update vendor without imageUrl', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });
			// Mock vendor ownership validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });

			const updateDataWithoutImage = { ...updateData };
			delete updateDataWithoutImage.imageUrl;
			const mockVendor = data.vendor({ id: 'vendor_123' });
			prisma.db.vendor.update.mockResolvedValue(mockVendor);

			await service.updateVendor('vendor_123', 'user_123', updateDataWithoutImage);

			expect(prisma.db.vendor.update).toHaveBeenCalledWith({
				data: {
					description: 'Updated vendor description',
					email: 'updated@vendor.com',
					name: 'Updated Vendor',
					phone: '987-654-3210',
					website: 'https://updatedvendor.com',
				},
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
		});

		it('should throw not found error when vendor does not exist', async () => {
			prisma.db.vendor.findFirst.mockResolvedValue(null);

			await expect(service.updateVendor('vendor_123', 'user_123', updateData)).rejects.toThrow(VendorDomainError);
		});

		it('should throw not found error when user is not the owner', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });
			// Mock vendor ownership validation - user is not owner
			prisma.db.vendor.findFirst.mockResolvedValueOnce(null);

			await expect(service.updateVendor('vendor_123', 'different_user', updateData)).rejects.toThrow(VendorDomainError);
		});

		it('should handle database errors', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });
			// Mock vendor ownership validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });

			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.update.mockRejectedValue(dbError);

			await expect(service.updateVendor('vendor_123', 'user_123', updateData)).rejects.toThrow(VendorDomainError);
		});
	});

	describe('deleteVendor', () => {
		it('should delete vendor successfully', async () => {
			const mockVendor = data.vendor({ id: 'vendor_123' });

			// Mock the sequence of findFirst calls:
			// 1. validateVendorExists - just needs to return something truthy
			// 2. validateVendorOwnership - just needs to return something truthy
			// 3. Inside deleteVendor method - this is the one that gets used for the event
			prisma.db.vendor.findFirst
				.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' }) // validateVendorExists
				.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' }) // validateVendorOwnership
				.mockResolvedValueOnce(mockVendor); // Inside deleteVendor - this one is used for event

			prisma.db.vendor.delete.mockResolvedValue(mockVendor);

			await service.deleteVendor('vendor_123', 'user_123');

			expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
				where: { id: 'vendor_123' },
			});
			expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
			expect(prisma.db.vendor.delete).toHaveBeenCalledWith({
				where: { id: 'vendor_123' },
			});
			expect(eventService.emit).toHaveBeenCalledWith('vendor.deleted', mockVendor);
		});

		it('should throw not found error when vendor does not exist', async () => {
			prisma.db.vendor.findFirst.mockResolvedValue(null);

			await expect(service.deleteVendor('vendor_123', 'user_123')).rejects.toThrow(VendorDomainError);
		});

		it('should throw not found error when user is not the owner', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });
			// Mock vendor ownership validation - user is not owner
			prisma.db.vendor.findFirst.mockResolvedValueOnce(null);

			await expect(service.deleteVendor('vendor_123', 'different_user')).rejects.toThrow(VendorDomainError);
		});

		it('should handle database errors', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });
			// Mock vendor ownership validation
			prisma.db.vendor.findFirst.mockResolvedValueOnce({ id: 'vendor_123', ownerId: 'user_123' });

			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.delete.mockRejectedValue(dbError);

			await expect(service.deleteVendor('vendor_123', 'user_123')).rejects.toThrow(VendorDomainError);
		});
	});

	describe('updateVendorLocation', () => {
		const location = { lat: 40.7128, long: -74.006 };

		it('should update vendor location successfully', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValue({ id: 'vendor_123', ownerId: 'user_123' });

			const mockVendor = data.vendor({ id: 'vendor_123' });
			prisma.db.vendor.update.mockResolvedValue(mockVendor);

			await service.updateVendorLocation('vendor_123', location);

			expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
				where: { id: 'vendor_123' },
			});
			expect(prisma.db.vendor.update).toHaveBeenCalledWith({
				data: {
					lat: location.lat,
					long: location.long,
				},
				where: {
					id: 'vendor_123',
				},
			});
			expect(eventService.emit).toHaveBeenCalledWith('vendor.updated', mockVendor);
		});

		it('should handle database errors', async () => {
			// Mock vendor exists validation
			prisma.db.vendor.findFirst.mockResolvedValue({ id: 'vendor_123', ownerId: 'user_123' });

			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.update.mockRejectedValue(dbError);

			await expect(service.updateVendorLocation('vendor_123', location)).rejects.toThrow(VendorDomainError);
		});

		it('should throw error when vendor does not exist', async () => {
			prisma.db.vendor.findFirst.mockResolvedValue(null);

			await expect(service.updateVendorLocation('vendor_123', location)).rejects.toThrow(VendorDomainError);
		});

		it('should throw error for invalid latitude', async () => {
			const invalidLocation = { lat: 100, long: -74.006 }; // Invalid latitude > 90
			prisma.db.vendor.findFirst.mockResolvedValue({ id: 'vendor_123', ownerId: 'user_123' });

			await expect(service.updateVendorLocation('vendor_123', invalidLocation)).rejects.toThrow(VendorDomainError);
		});

		it('should throw error for invalid longitude', async () => {
			const invalidLocation = { lat: 40.7128, long: 200 }; // Invalid longitude > 180
			prisma.db.vendor.findFirst.mockResolvedValue({ id: 'vendor_123', ownerId: 'user_123' });

			await expect(service.updateVendorLocation('vendor_123', invalidLocation)).rejects.toThrow(VendorDomainError);
		});
	});
});

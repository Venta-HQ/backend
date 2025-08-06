import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@app/nest/errors';
import { clearMocks, data, errors, mockPrisma } from '../../../test/helpers/test-utils';
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

			await expect(service.getVendorById('vendor_123')).rejects.toThrow('Database connection failed');
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
			expect(eventService.emit).toHaveBeenCalledWith('vendor.created', {
				createdAt: mockVendor.createdAt,
				description: mockVendor.description,
				email: mockVendor.email,
				id: mockVendor.id,
				lat: mockVendor.lat,
				long: mockVendor.long,
				name: mockVendor.name,
				open: mockVendor.open,
				phone: mockVendor.phone,
				primaryImage: mockVendor.primaryImage,
				updatedAt: mockVendor.updatedAt,
				website: mockVendor.website,
			});
			expect(result).toBe('vendor_123');
		});

		it('should create vendor without imageUrl', async () => {
			const { imageUrl, ...dataWithoutImage } = createData;
			const { imageUrl: _, ...vendorData } = data.vendor({ id: 'vendor_123', ...dataWithoutImage });
			const mockVendor = {
				...vendorData,
				primaryImage: undefined,
			};
			prisma.db.vendor.create.mockResolvedValue(mockVendor);

			const result = await service.createVendor({ ...dataWithoutImage, imageUrl: undefined });

			expect(prisma.db.vendor.create).toHaveBeenCalledWith({
				data: {
					description: 'A test vendor',
					email: 'test@vendor.com',
					name: 'Test Vendor',
					ownerId: 'user_123',
					phone: '123-456-7890',
					primaryImage: undefined,
					website: 'https://testvendor.com',
				},
			});
			expect(result).toBe('vendor_123');
		});

		it('should handle database errors', async () => {
			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.create.mockRejectedValue(dbError);

			await expect(service.createVendor(createData)).rejects.toThrow('Database connection failed');
		});
	});

	describe('updateVendor', () => {
		const updateData = {
			description: 'An updated vendor',
			email: 'updated@vendor.com',
			imageUrl: 'https://example.com/updated-image.jpg',
			name: 'Updated Vendor',
			phone: '987-654-3210',
			website: 'https://updatedvendor.com',
		};

		it('should update vendor successfully', async () => {
			prisma.db.vendor.count.mockResolvedValue(1);
			const { imageUrl, ...vendorData } = data.vendor({ id: 'vendor_123', ...updateData });
			const mockVendor = {
				...vendorData,
				primaryImage: updateData.imageUrl, // Map imageUrl to primaryImage for database model
			};
			prisma.db.vendor.update.mockResolvedValue(mockVendor);

			await service.updateVendor('vendor_123', 'user_123', updateData);

			expect(prisma.db.vendor.count).toHaveBeenCalledWith({
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
			expect(prisma.db.vendor.update).toHaveBeenCalledWith({
				data: {
					description: 'An updated vendor',
					email: 'updated@vendor.com',
					name: 'Updated Vendor',
					phone: '987-654-3210',
					primaryImage: 'https://example.com/updated-image.jpg',
					website: 'https://updatedvendor.com',
				},
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
			expect(eventService.emit).toHaveBeenCalledWith('vendor.updated', {
				createdAt: mockVendor.createdAt,
				description: mockVendor.description,
				email: mockVendor.email,
				id: mockVendor.id,
				lat: mockVendor.lat,
				long: mockVendor.long,
				name: mockVendor.name,
				open: mockVendor.open,
				phone: mockVendor.phone,
				primaryImage: mockVendor.primaryImage,
				updatedAt: mockVendor.updatedAt,
				website: mockVendor.website,
			});
		});

		it('should update vendor without imageUrl', async () => {
			const { imageUrl, ...dataWithoutImage } = updateData;
			prisma.db.vendor.count.mockResolvedValue(1);
			const { imageUrl: _, ...vendorData } = data.vendor({ id: 'vendor_123', ...dataWithoutImage });
			const mockVendor = {
				...vendorData,
				primaryImage: undefined,
			};
			prisma.db.vendor.update.mockResolvedValue(mockVendor);

			await service.updateVendor('vendor_123', 'user_123', { ...dataWithoutImage, imageUrl: undefined });

			expect(prisma.db.vendor.update).toHaveBeenCalledWith({
				data: {
					description: 'An updated vendor',
					email: 'updated@vendor.com',
					name: 'Updated Vendor',
					phone: '987-654-3210',
					website: 'https://updatedvendor.com',
				},
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
		});

		it('should throw not found error when vendor does not exist', async () => {
			prisma.db.vendor.count.mockResolvedValue(0);

			await expect(service.updateVendor('vendor_123', 'user_123', updateData)).rejects.toThrow(AppError);
		});

		it('should throw not found error when user is not the owner', async () => {
			prisma.db.vendor.count.mockResolvedValue(0);

			await expect(service.updateVendor('vendor_123', 'different_user', updateData)).rejects.toThrow(AppError);
		});

		it('should handle database errors', async () => {
			prisma.db.vendor.count.mockResolvedValue(1);
			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.update.mockRejectedValue(dbError);

			await expect(service.updateVendor('vendor_123', 'user_123', updateData)).rejects.toThrow(
				'Database connection failed',
			);
		});
	});

	describe('deleteVendor', () => {
		it('should delete vendor successfully', async () => {
			const { imageUrl, ...vendorData } = data.vendor({ id: 'vendor_123' });
			const mockVendor = {
				...vendorData,
				primaryImage: 'https://example.com/image.jpg', // Add primaryImage for database model
			};
			prisma.db.vendor.findFirst.mockResolvedValue(mockVendor);
			prisma.db.vendor.delete.mockResolvedValue(mockVendor);

			await service.deleteVendor('vendor_123', 'user_123');

			expect(prisma.db.vendor.findFirst).toHaveBeenCalledWith({
				where: { id: 'vendor_123', ownerId: 'user_123' },
			});
			expect(prisma.db.vendor.delete).toHaveBeenCalledWith({
				where: { id: 'vendor_123' },
			});
			expect(eventService.emit).toHaveBeenCalledWith('vendor.deleted', {
				createdAt: mockVendor.createdAt,
				description: mockVendor.description,
				email: mockVendor.email,
				id: mockVendor.id,
				lat: mockVendor.lat,
				long: mockVendor.long,
				name: mockVendor.name,
				open: mockVendor.open,
				phone: mockVendor.phone,
				primaryImage: mockVendor.primaryImage,
				updatedAt: mockVendor.updatedAt,
				website: mockVendor.website,
			});
		});

		it('should throw not found error when vendor does not exist', async () => {
			prisma.db.vendor.findFirst.mockResolvedValue(null);

			await expect(service.deleteVendor('vendor_123', 'user_123')).rejects.toThrow(AppError);
		});

		it('should throw not found error when user is not the owner', async () => {
			prisma.db.vendor.findFirst.mockResolvedValue(null);

			await expect(service.deleteVendor('vendor_123', 'different_user')).rejects.toThrow(AppError);
		});

		it('should handle database errors', async () => {
			const mockVendor = data.vendor({ id: 'vendor_123' });
			prisma.db.vendor.findFirst.mockResolvedValue(mockVendor);
			const dbError = errors.database('Database connection failed');
			prisma.db.vendor.delete.mockRejectedValue(dbError);

			await expect(service.deleteVendor('vendor_123', 'user_123')).rejects.toThrow('Database connection failed');
		});
	});
});

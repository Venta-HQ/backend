import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationDomainErrorCodes } from '@app/nest/errors';
import { LocationTrackingService } from './location-tracking.service';

describe('LocationTrackingService', () => {
	let service: LocationTrackingService;
	let mockRedis: any;
	let mockPrisma: any;
	let mockEventService: any;

	beforeEach(() => {
		mockRedis = {
			geoadd: vi.fn(),
		};

		mockPrisma = {
			db: {
				user: {
					findUnique: vi.fn(),
					update: vi.fn(),
				},
				vendor: {
					findUnique: vi.fn(),
				},
			},
		};

		mockEventService = {
			emit: vi.fn(),
		};

		service = new LocationTrackingService(mockRedis, mockPrisma, mockEventService);
	});

	describe('updateVendorLocation', () => {
		it('should update vendor location successfully', async () => {
			const vendorId = 'vendor-123';
			const location = { lat: 40.7128, lng: -74.006 };

			mockPrisma.db.vendor.findUnique.mockResolvedValue({ id: vendorId });
			mockRedis.geoadd.mockResolvedValue(1);
			mockEventService.emit.mockResolvedValue(undefined);

			await service.updateVendorLocation(vendorId, location);

			expect(mockPrisma.db.vendor.findUnique).toHaveBeenCalledWith({
				select: { id: true },
				where: { id: vendorId },
			});
			expect(mockRedis.geoadd).toHaveBeenCalledWith('vendor_locations', location.lng, location.lat, vendorId);
			expect(mockEventService.emit).toHaveBeenCalledWith('vendor.location.updated', {
				location: {
					lat: location.lat,
					long: location.lng,
				},
				timestamp: expect.any(Date),
				vendorId,
			});
		});

		it('should throw error for invalid latitude', async () => {
			const vendorId = 'vendor-123';
			const location = { lat: 100, lng: -74.006 }; // Invalid latitude

			await expect(service.updateVendorLocation(vendorId, location)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.INVALID_LATITUDE,
					details: { lat: 100 },
					message: 'Invalid latitude value',
				}),
			);
		});

		it('should throw error for invalid longitude', async () => {
			const vendorId = 'vendor-123';
			const location = { lat: 40.7128, lng: 200 }; // Invalid longitude

			await expect(service.updateVendorLocation(vendorId, location)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.INVALID_LONGITUDE,
					details: { lng: 200 },
					message: 'Invalid longitude value',
				}),
			);
		});

		it('should throw error for non-existent vendor', async () => {
			const vendorId = 'vendor-123';
			const location = { lat: 40.7128, lng: -74.006 };

			mockPrisma.db.vendor.findUnique.mockResolvedValue(null);

			await expect(service.updateVendorLocation(vendorId, location)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.LOCATION_NOT_FOUND,
					details: { vendorId },
					message: 'Vendor not found',
				}),
			);
		});
	});

	describe('updateUserLocation', () => {
		it('should update user location successfully', async () => {
			const userId = 'user-123';
			const location = { lat: 40.7128, lng: -74.006 };

			mockPrisma.db.user.findUnique.mockResolvedValue({ id: userId });
			mockRedis.geoadd.mockResolvedValue(1);
			mockPrisma.db.user.update.mockResolvedValue({ id: userId });

			await service.updateUserLocation(userId, location);

			expect(mockPrisma.db.user.findUnique).toHaveBeenCalledWith({
				select: { id: true },
				where: { id: userId },
			});
			expect(mockRedis.geoadd).toHaveBeenCalledWith('user_locations', location.lng, location.lat, userId);
			expect(mockPrisma.db.user.update).toHaveBeenCalledWith({
				data: { lat: location.lat, long: location.lng },
				where: { id: userId },
			});
		});

		it('should throw error for non-existent user', async () => {
			const userId = 'user-123';
			const location = { lat: 40.7128, lng: -74.006 };

			mockPrisma.db.user.findUnique.mockResolvedValue(null);

			await expect(service.updateUserLocation(userId, location)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.LOCATION_NOT_FOUND,
					details: { userId },
					message: 'User not found',
				}),
			);
		});
	});
});

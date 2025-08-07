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
			geopos: vi.fn(),
			georadius: vi.fn(),
			zrem: vi.fn(),
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
			expect(mockEventService.emit).toHaveBeenCalledWith('location.vendor_location_updated', {
				accuracy: undefined,
				location,
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
			mockEventService.emit.mockResolvedValue(undefined);

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
			expect(mockEventService.emit).toHaveBeenCalledWith('location.user_location_updated', {
				accuracy: undefined,
				location,
				timestamp: expect.any(Date),
				userId,
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

	describe('findNearbyVendors', () => {
		it('should find nearby vendors successfully', async () => {
			const userLocation = { lat: 40.7128, lng: -74.006 };
			const radius = 5000;
			const userId = 'user-123';

			mockRedis.georadius.mockResolvedValue([
				['vendor-1', [40.7129, -74.0061], 100],
				['vendor-2', [40.7127, -74.0059], 200],
			]);
			mockEventService.emit.mockResolvedValue(undefined);

			const result = await service.findNearbyVendors(userLocation, radius, userId);

			expect(mockRedis.georadius).toHaveBeenCalledWith(
				'vendor_locations',
				userLocation.lng,
				userLocation.lat,
				radius,
				'm',
				'WITHCOORD',
				'WITHDIST',
			);
			expect(result.vendors).toHaveLength(2);
			expect(result.searchId).toMatch(/^search_\d+_[a-z0-9]+$/);
			expect(result.query).toEqual({
				lat: userLocation.lat,
				lng: userLocation.lng,
				radius,
			});
			expect(mockEventService.emit).toHaveBeenCalledWith('location.geolocation_search_completed', {
				query: result.query,
				results: expect.arrayContaining([
					expect.objectContaining({ distance: 100, vendorId: 'vendor-1' }),
					expect.objectContaining({ distance: 200, vendorId: 'vendor-2' }),
				]),
				searchId: result.searchId,
				timestamp: expect.any(Date),
			});
		});

		it('should throw error for invalid radius', async () => {
			const userLocation = { lat: 40.7128, lng: -74.006 };
			const radius = -1000; // Invalid radius

			await expect(service.findNearbyVendors(userLocation, radius)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.PROXIMITY_SEARCH_FAILED,
					details: { radius },
					message: 'Search radius must be between 1 and 50,000 meters',
				}),
			);
		});

		it('should emit proximity alerts for close vendors', async () => {
			const userLocation = { lat: 40.7128, lng: -74.006 };
			const radius = 5000;
			const userId = 'user-123';

			// Vendor within 100 meters (close proximity threshold)
			mockRedis.georadius.mockResolvedValue([['vendor-1', [40.7128, -74.006], 50]]);
			mockEventService.emit.mockResolvedValue(undefined);

			await service.findNearbyVendors(userLocation, radius, userId);

			// Should emit proximity alert for vendor within 100m
			expect(mockEventService.emit).toHaveBeenCalledWith('location.proximity_alert', {
				distance: 50,
				location: userLocation,
				timestamp: expect.any(Date),
				userId,
				vendorId: 'vendor-1',
			});
		});
	});

	describe('getVendorLocation', () => {
		it('should get vendor location successfully', async () => {
			const vendorId = 'vendor-123';
			const coordinates = [[-74.006, 40.7128]];

			mockPrisma.db.vendor.findUnique.mockResolvedValue({ id: vendorId });
			mockRedis.geopos.mockResolvedValue(coordinates);

			const result = await service.getVendorLocation(vendorId);

			expect(result).toEqual({ lat: 40.7128, lng: -74.006 });
		});

		it('should return null for non-existent location', async () => {
			const vendorId = 'vendor-123';

			mockPrisma.db.vendor.findUnique.mockResolvedValue({ id: vendorId });
			mockRedis.geopos.mockResolvedValue(null);

			const result = await service.getVendorLocation(vendorId);

			expect(result).toBeNull();
		});

		it('should throw error for non-existent vendor', async () => {
			const vendorId = 'vendor-123';

			mockPrisma.db.vendor.findUnique.mockResolvedValue(null);

			await expect(service.getVendorLocation(vendorId)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.LOCATION_NOT_FOUND,
					details: { vendorId },
					message: 'Vendor not found',
				}),
			);
		});
	});

	describe('removeVendorLocation', () => {
		it('should remove vendor location successfully', async () => {
			const vendorId = 'vendor-123';

			mockPrisma.db.vendor.findUnique.mockResolvedValue({ id: vendorId });
			mockRedis.zrem.mockResolvedValue(1);
			mockEventService.emit.mockResolvedValue(undefined);

			await service.removeVendorLocation(vendorId);

			expect(mockRedis.zrem).toHaveBeenCalledWith('vendor_locations', vendorId);
			expect(mockEventService.emit).toHaveBeenCalledWith('location.vendor_location_removed', {
				timestamp: expect.any(Date),
				vendorId,
			});
		});

		it('should throw error for non-existent vendor', async () => {
			const vendorId = 'vendor-123';

			mockPrisma.db.vendor.findUnique.mockResolvedValue(null);

			await expect(service.removeVendorLocation(vendorId)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.LOCATION_NOT_FOUND,
					details: { vendorId },
					message: 'Vendor not found',
				}),
			);
		});
	});

	describe('validation', () => {
		it('should validate location accuracy within bounds', async () => {
			const vendorId = 'vendor-123';
			const location = { accuracy: 500, lat: 40.7128, lng: -74.006 };

			mockPrisma.db.vendor.findUnique.mockResolvedValue({ id: vendorId });
			mockRedis.geoadd.mockResolvedValue(1);
			mockEventService.emit.mockResolvedValue(undefined);

			await service.updateVendorLocation(vendorId, location);

			expect(mockEventService.emit).toHaveBeenCalledWith('location.vendor_location_updated', {
				accuracy: 500,
				location,
				timestamp: expect.any(Date),
				vendorId,
			});
		});

		it('should throw error for invalid accuracy', async () => {
			const vendorId = 'vendor-123';
			const location = { accuracy: 1500, lat: 40.7128, lng: -74.006 }; // Too high

			await expect(service.updateVendorLocation(vendorId, location)).rejects.toThrow(
				expect.objectContaining({
					code: LocationDomainErrorCodes.INVALID_COORDINATES,
					details: { accuracy: 1500 },
					message: 'Location accuracy must be between 0 and 1000 meters',
				}),
			);
		});
	});
});

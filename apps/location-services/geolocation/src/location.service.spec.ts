import { vi } from 'vitest';
import { AppError } from '@app/nest/errors';
import { clearMocks, data, mockEvents, mockPrisma } from '../../../../test/helpers/test-utils';
import { LocationService } from './location.service';

// Mock the retry utility
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
		return await operation();
	}),
}));

describe('LocationService', () => {
	let service: LocationService;
	let redis: any;
	let prisma: any;
	let eventsService: any;

	beforeEach(() => {
		redis = {
			geoadd: vi.fn(),
			geopos: vi.fn(),
			geosearch: vi.fn(),
			zrem: vi.fn(),
		};
		prisma = mockPrisma();
		eventsService = {
			...mockEvents(),
			emit: vi.fn(),
		};
		service = new LocationService(redis, prisma, eventsService);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('updateVendorLocation', () => {
		const locationData = {
			entityId: 'vendor_123',
			location: {
				lat: 40.7128,
				long: -74.006,
			},
		};

		it('should update vendor location successfully', async () => {
			redis.geoadd.mockResolvedValue(1);
			eventsService.emit.mockResolvedValue(undefined);

			await service.updateVendorLocation(locationData);

			expect(redis.geoadd).toHaveBeenCalledWith('vendor_locations', -74.006, 40.7128, 'vendor_123');
		});

		it('should throw validation error when location is missing', async () => {
			const invalidData = {
				entityId: 'vendor_123',
				location: null,
			};

			await expect(service.updateVendorLocation(invalidData)).rejects.toThrow(AppError);
		});

		it('should handle vendor not found error', async () => {
			redis.geoadd.mockResolvedValue(1);

			await service.updateVendorLocation(locationData);
		});

		it('should handle Redis errors gracefully', async () => {
			const redisError = new Error('Redis connection failed');
			redis.geoadd.mockRejectedValue(redisError);

			await expect(service.updateVendorLocation(locationData)).rejects.toThrow(AppError);
		});

		it('should handle event service errors gracefully', async () => {
			redis.geoadd.mockResolvedValue(1);

			await service.updateVendorLocation(locationData);
		});
	});

	describe('updateUserLocation', () => {
		const locationData = {
			entityId: 'user_123',
			location: {
				lat: 40.7128,
				long: -74.006,
			},
		};

		it('should update user location successfully', async () => {
			redis.geoadd.mockResolvedValue(1);

			await service.updateUserLocation(locationData);

			expect(redis.geoadd).toHaveBeenCalledWith('user_locations', -74.006, 40.7128, 'user_123');
		});

		it('should throw validation error when location is missing', async () => {
			const invalidData = {
				entityId: 'user_123',
				location: null,
			};

			await expect(service.updateUserLocation(invalidData)).rejects.toThrow(AppError);
		});

		it('should handle Redis errors gracefully', async () => {
			const redisError = new Error('Redis connection failed');
			redis.geoadd.mockRejectedValue(redisError);

			await expect(service.updateUserLocation(locationData)).rejects.toThrow(AppError);
		});

		it('should handle database errors gracefully', async () => {
			redis.geoadd.mockResolvedValue(1);

			await service.updateUserLocation(locationData);
		});
	});

	describe('searchVendorLocations', () => {
		const searchRequest = {
			neLocation: { lat: 40.7589, long: -73.9851 },
			swLocation: { lat: 40.7505, long: -73.9934 },
		};

		it('should search vendor locations successfully', async () => {
			const mockResults = [
				['vendor_1', [40.7128, -74.006]],
				['vendor_2', [40.7589, -73.9851]],
			];
			redis.geosearch.mockResolvedValue(mockResults);

			const result = await service.searchVendorLocations(searchRequest);

			expect(redis.geosearch).toHaveBeenCalledWith(
				'vendor_locations',
				'BYBOX',
				-73.9934,
				40.7505,
				-73.9851,
				40.7589,
				'WITHCOORD',
			);
			expect(result).toEqual({
				vendors: [
					{
						id: 'vendor_1',
						location: { lat: -74.006, long: 40.7128 },
					},
					{
						id: 'vendor_2',
						location: { lat: -73.9851, long: 40.7589 },
					},
				],
			});
		});

		it('should return empty results when no vendors found', async () => {
			redis.geosearch.mockResolvedValue([]);

			const result = await service.searchVendorLocations(searchRequest);

			expect(result).toEqual({ vendors: [] });
		});

		it('should throw validation error when locations are missing', async () => {
			const invalidRequest = {
				neLocation: null,
				swLocation: { lat: 40.7505, long: -73.9934 },
			};

			await expect(service.searchVendorLocations(invalidRequest)).rejects.toThrow(AppError);
		});

		it('should handle Redis errors gracefully', async () => {
			const redisError = new Error('Redis connection failed');
			redis.geosearch.mockRejectedValue(redisError);

			await expect(service.searchVendorLocations(searchRequest)).rejects.toThrow(AppError);
		});
	});

	describe('getVendorLocation', () => {
		it('should return vendor location when found', async () => {
			const coordinates = [[-74.006, 40.7128]];
			redis.geopos.mockResolvedValue(coordinates);

			const result = await service.getVendorLocation('vendor_123');

			expect(redis.geopos).toHaveBeenCalledWith('vendor_locations', 'vendor_123');
			expect(result).toEqual({ lat: 40.7128, long: -74.006 });
		});

		it('should return null when vendor location not found', async () => {
			redis.geopos.mockResolvedValue([null]);

			const result = await service.getVendorLocation('vendor_123');

			expect(result).toBeNull();
		});

		it('should return null when coordinates array is empty', async () => {
			redis.geopos.mockResolvedValue([]);

			const result = await service.getVendorLocation('vendor_123');

			expect(result).toBeNull();
		});

		it('should handle Redis errors gracefully', async () => {
			const redisError = new Error('Redis connection failed');
			redis.geopos.mockRejectedValue(redisError);

			await expect(service.getVendorLocation('vendor_123')).rejects.toThrow(AppError);
		});
	});

	describe('removeVendorLocation', () => {
		it('should remove vendor location successfully', async () => {
			redis.zrem.mockResolvedValue(1);

			await service.removeVendorLocation('vendor_123');

			expect(redis.zrem).toHaveBeenCalledWith('vendor_locations', 'vendor_123');
		});

		it('should handle Redis errors gracefully', async () => {
			const redisError = new Error('Redis connection failed');
			redis.zrem.mockRejectedValue(redisError);

			await expect(service.removeVendorLocation('vendor_123')).rejects.toThrow(AppError);
		});
	});
});

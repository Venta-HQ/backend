import { vi } from 'vitest';
import { clearMocks } from '../../../../test/helpers/test-utils';
import { LocationController } from './location.controller';

// Mock the proto modules
vi.mock('@app/proto/location', () => ({
	LOCATION_SERVICE_NAME: 'LocationService',
	LocationServiceClient: vi.fn(),
}));

describe('LocationController', () => {
	let controller: LocationController;
	let locationService: any;
	let locationTrackingService: any;

	beforeEach(() => {
		locationService = {
			searchVendorLocations: vi.fn(),
			updateVendorLocation: vi.fn(),
		};
		locationTrackingService = {
			updateVendorLocation: vi.fn(),
			updateUserLocation: vi.fn(),
			findNearbyVendors: vi.fn(),
			getVendorLocation: vi.fn(),
			removeVendorLocation: vi.fn(),
		};
		controller = new LocationController(locationService, locationTrackingService);
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
			locationTrackingService.updateVendorLocation.mockResolvedValue(undefined);

			const result = await controller.updateVendorLocation(locationData);

			expect(locationTrackingService.updateVendorLocation).toHaveBeenCalledWith('vendor_123', {
				lat: 40.7128,
				lng: -74.006,
			});
			expect(result).toEqual({});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationTrackingService.updateVendorLocation.mockRejectedValue(serviceError);

			await expect(controller.updateVendorLocation(locationData)).rejects.toThrow('Service error');
		});
	});

	describe('vendorLocations', () => {
		const searchRequest = {
			neLocation: { lat: 40.7589, long: -73.9851 },
			swLocation: { lat: 40.7505, long: -73.9934 },
		};

		const mockVendors = [
			{
				id: 'vendor_1',
				location: { lat: 40.7128, long: -74.006 },
			},
			{
				id: 'vendor_2',
				location: { lat: 40.7589, long: -73.9851 },
			},
		];

		it('should search vendor locations successfully', async () => {
			locationService.searchVendorLocations.mockResolvedValue({ vendors: mockVendors });

			const result = await controller.vendorLocations(searchRequest);

			expect(locationService.searchVendorLocations).toHaveBeenCalledWith(searchRequest);
			expect(result).toEqual({ vendors: mockVendors });
		});

		it('should return empty results when no vendors found', async () => {
			locationService.searchVendorLocations.mockResolvedValue({ vendors: [] });

			const result = await controller.vendorLocations(searchRequest);

			expect(result).toEqual({ vendors: [] });
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationService.searchVendorLocations.mockRejectedValue(serviceError);

			await expect(controller.vendorLocations(searchRequest)).rejects.toThrow('Service error');
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
			locationTrackingService.updateUserLocation.mockResolvedValue(undefined);

			const result = await controller.updateUserLocation(locationData);

			expect(locationTrackingService.updateUserLocation).toHaveBeenCalledWith('user_123', {
				lat: 40.7128,
				lng: -74.006,
			});
			expect(result).toEqual({});
		});
	});

	describe('findNearbyVendors', () => {
		const request = {
			lat: 40.7128,
			lng: -74.006,
			radius: 5000,
			userId: 'user_123',
		};

		const mockResult = {
			vendors: [
				{ id: 'vendor_1', location: { lat: 40.7129, lng: -74.0061 }, distance: 100 },
			],
			searchId: 'search_123',
			query: { lat: 40.7128, lng: -74.006, radius: 5000 },
		};

		it('should find nearby vendors successfully', async () => {
			locationTrackingService.findNearbyVendors.mockResolvedValue(mockResult);

			const result = await controller.findNearbyVendors(request);

			expect(locationTrackingService.findNearbyVendors).toHaveBeenCalledWith(
				{ lat: 40.7128, lng: -74.006 },
				5000,
				'user_123',
			);
			expect(result).toEqual(mockResult);
		});
	});

	describe('getVendorLocation', () => {
		const request = { vendorId: 'vendor_123' };

		it('should get vendor location successfully', async () => {
			const mockLocation = { lat: 40.7128, lng: -74.006 };
			locationTrackingService.getVendorLocation.mockResolvedValue(mockLocation);

			const result = await controller.getVendorLocation(request);

			expect(locationTrackingService.getVendorLocation).toHaveBeenCalledWith('vendor_123');
			expect(result).toEqual({ location: mockLocation });
		});

		it('should return undefined when vendor location not found', async () => {
			locationTrackingService.getVendorLocation.mockResolvedValue(null);

			const result = await controller.getVendorLocation(request);

			expect(result).toEqual({ location: undefined });
		});
	});

	describe('removeVendorLocation', () => {
		const request = { vendorId: 'vendor_123' };

		it('should remove vendor location successfully', async () => {
			locationTrackingService.removeVendorLocation.mockResolvedValue(undefined);

			const result = await controller.removeVendorLocation(request);

			expect(locationTrackingService.removeVendorLocation).toHaveBeenCalledWith('vendor_123');
			expect(result).toEqual({});
		});
	});
});

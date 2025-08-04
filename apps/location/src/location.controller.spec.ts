import { vi } from 'vitest';
import { clearMocks } from '../../../test/helpers/test-utils';
import { LocationController } from './location.controller';

// Mock the proto modules
vi.mock('@app/proto/location', () => ({
	LOCATION_SERVICE_NAME: 'LocationService',
	LocationServiceClient: vi.fn(),
}));

describe('LocationController', () => {
	let controller: LocationController;
	let locationService: any;

	beforeEach(() => {
		locationService = {
			searchVendorLocations: vi.fn(),
			updateVendorLocation: vi.fn(),
		};
		controller = new LocationController(locationService);
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
			locationService.updateVendorLocation.mockResolvedValue(undefined);

			const result = await controller.updateVendorLocation(locationData);

			expect(locationService.updateVendorLocation).toHaveBeenCalledWith(locationData);
			expect(result).toEqual({});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationService.updateVendorLocation.mockRejectedValue(serviceError);

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
});

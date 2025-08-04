import { vi } from 'vitest';
import { clearMocks, grpc, mockGrpcClient, mockRequest } from '../../../test/helpers/test-utils';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

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
			getVendorLocation: vi.fn(),
			removeVendorLocation: vi.fn(),
			searchVendorLocations: vi.fn(),
			updateUserLocation: vi.fn(),
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

			const request = mockRequest(locationData);
			const result = await controller.updateVendorLocation(request);

			expect(locationService.updateVendorLocation).toHaveBeenCalledWith(locationData);
			expect(result).toEqual({});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationService.updateVendorLocation.mockRejectedValue(serviceError);

			const request = mockRequest(locationData);

			await expect(controller.updateVendorLocation(request)).rejects.toThrow('Service error');
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
			locationService.updateUserLocation.mockResolvedValue(undefined);

			const request = mockRequest(locationData);
			const result = await controller.updateUserLocation(request);

			expect(locationService.updateUserLocation).toHaveBeenCalledWith(locationData);
			expect(result).toEqual({});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationService.updateUserLocation.mockRejectedValue(serviceError);

			const request = mockRequest(locationData);

			await expect(controller.updateUserLocation(request)).rejects.toThrow('Service error');
		});
	});

	describe('searchVendorLocations', () => {
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

			const request = mockRequest(searchRequest);
			const result = await controller.searchVendorLocations(request);

			expect(locationService.searchVendorLocations).toHaveBeenCalledWith(searchRequest);
			expect(result).toEqual({ vendors: mockVendors });
		});

		it('should return empty results when no vendors found', async () => {
			locationService.searchVendorLocations.mockResolvedValue({ vendors: [] });

			const request = mockRequest(searchRequest);
			const result = await controller.searchVendorLocations(request);

			expect(result).toEqual({ vendors: [] });
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationService.searchVendorLocations.mockRejectedValue(serviceError);

			const request = mockRequest(searchRequest);

			await expect(controller.searchVendorLocations(request)).rejects.toThrow('Service error');
		});
	});

	describe('getVendorLocation', () => {
		it('should return vendor location when found', async () => {
			const mockLocation = { lat: 40.7128, long: -74.006 };
			locationService.getVendorLocation.mockResolvedValue(mockLocation);

			const request = mockRequest({ vendorId: 'vendor_123' });
			const result = await controller.getVendorLocation(request);

			expect(locationService.getVendorLocation).toHaveBeenCalledWith('vendor_123');
			expect(result).toEqual({ location: mockLocation });
		});

		it('should return null when vendor location not found', async () => {
			locationService.getVendorLocation.mockResolvedValue(null);

			const request = mockRequest({ vendorId: 'vendor_123' });
			const result = await controller.getVendorLocation(request);

			expect(result).toEqual({ location: null });
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationService.getVendorLocation.mockRejectedValue(serviceError);

			const request = mockRequest({ vendorId: 'vendor_123' });

			await expect(controller.getVendorLocation(request)).rejects.toThrow('Service error');
		});
	});

	describe('removeVendorLocation', () => {
		it('should remove vendor location successfully', async () => {
			locationService.removeVendorLocation.mockResolvedValue(undefined);

			const request = mockRequest({ vendorId: 'vendor_123' });
			const result = await controller.removeVendorLocation(request);

			expect(locationService.removeVendorLocation).toHaveBeenCalledWith('vendor_123');
			expect(result).toEqual({});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			locationService.removeVendorLocation.mockRejectedValue(serviceError);

			const request = mockRequest({ vendorId: 'vendor_123' });

			await expect(controller.removeVendorLocation(request)).rejects.toThrow('Service error');
		});
	});
});

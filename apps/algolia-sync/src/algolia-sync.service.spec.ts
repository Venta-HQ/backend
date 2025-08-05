import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlgoliaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { Test, TestingModule } from '@nestjs/testing';
import { AlgoliaSyncService } from './algolia-sync.service';

// Mock the retry utility to actually call the function
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
		return await operation();
	}),
}));

describe('AlgoliaSyncService', () => {
	let service: AlgoliaSyncService;
	let algoliaService: any;

	const mockVendor = {
		createdAt: new Date().toISOString(),
		description: 'A test vendor',
		email: 'test@vendor.com',
		id: 'vendor_123',
		lat: 40.7128,
		long: -74.006,
		name: 'Test Vendor',
		open: true,
		phone: '123-456-7890',
		primaryImage: 'https://example.com/image.jpg',
		updatedAt: new Date().toISOString(),
		website: 'https://testvendor.com',
	};

	const mockLocationData = {
		entityId: 'vendor_123',
		location: {
			lat: 40.7128,
			long: -74.006,
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AlgoliaSyncService,
				{
					provide: AlgoliaService,
					useValue: {
						createObject: vi.fn(),
						updateObject: vi.fn(),
						deleteObject: vi.fn(),
					},
				},
			],
		}).compile();

		service = module.get<AlgoliaSyncService>(AlgoliaSyncService);
		algoliaService = module.get(AlgoliaService);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handleVendorCreated', () => {
		it('should create vendor in Algolia with geolocation', async () => {
			await service.handleVendorCreated(mockVendor);

			expect(retryOperation).toHaveBeenCalledWith(expect.any(Function), 'Creating vendor in Algolia: vendor_123', {
				logger: expect.any(Object),
			});

			expect(algoliaService.createObject).toHaveBeenCalledWith('vendor', {
				...mockVendor,
				_geoloc: {
					lat: mockVendor.lat,
					lng: mockVendor.long,
				},
			});
		});

		it('should create vendor in Algolia without geolocation when lat/long are missing', async () => {
			const vendorWithoutLocation = { ...mockVendor, lat: undefined, long: undefined };

			await service.handleVendorCreated(vendorWithoutLocation);

			expect(algoliaService.createObject).toHaveBeenCalledWith('vendor', vendorWithoutLocation);
		});
	});

	describe('handleVendorUpdated', () => {
		it('should update vendor in Algolia with geolocation', async () => {
			await service.handleVendorUpdated(mockVendor);

			expect(retryOperation).toHaveBeenCalledWith(expect.any(Function), 'Updating vendor in Algolia: vendor_123', {
				logger: expect.any(Object),
			});

			expect(algoliaService.updateObject).toHaveBeenCalledWith('vendor', 'vendor_123', {
				...mockVendor,
				_geoloc: {
					lat: mockVendor.lat,
					lng: mockVendor.long,
				},
			});
		});
	});

	describe('handleVendorDeleted', () => {
		it('should delete vendor from Algolia', async () => {
			await service.handleVendorDeleted(mockVendor);

			expect(retryOperation).toHaveBeenCalledWith(expect.any(Function), 'Deleting vendor from Algolia: vendor_123', {
				logger: expect.any(Object),
			});

			expect(algoliaService.deleteObject).toHaveBeenCalledWith('vendor', 'vendor_123');
		});
	});

	describe('handleVendorLocationUpdated', () => {
		it('should update vendor location in Algolia', async () => {
			await service.handleVendorLocationUpdated(mockLocationData);

			expect(retryOperation).toHaveBeenCalledWith(
				expect.any(Function),
				'Updating vendor location in Algolia: vendor_123',
				{ logger: expect.any(Object) },
			);

			expect(algoliaService.updateObject).toHaveBeenCalledWith('vendor', 'vendor_123', {
				_geoloc: {
					lat: mockLocationData.location.lat,
					lng: mockLocationData.location.long,
				},
			});
		});
	});
});

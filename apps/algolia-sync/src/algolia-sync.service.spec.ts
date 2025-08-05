import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMocks, data, errors } from '../../../test/helpers/test-utils';
import { AlgoliaSyncService } from './algolia-sync.service';

// Mock the retry utility
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
		return await operation();
	}),
}));

// Helper function to create BaseEvent
function createBaseEvent(eventData: any, eventId = 'test-event') {
	return {
		data: eventData,
		eventId,
		source: 'test-service',
		timestamp: new Date().toISOString(),
		version: '1.0',
	};
}

describe('AlgoliaSyncService', () => {
	let service: AlgoliaSyncService;
	let algoliaService: any;

	beforeEach(() => {
		algoliaService = {
			createObject: vi.fn(),
			deleteObject: vi.fn(),
			updateObject: vi.fn(),
		};
		service = new AlgoliaSyncService(algoliaService);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('Event Handling', () => {
		describe('vendor.created', () => {
			it('should handle vendor created event successfully', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: 40.7128,
					long: -74.006,
				});

				algoliaService.createObject.mockResolvedValue({ objectID: 'vendor_123' });

				await service.processVendorEvent(createBaseEvent(vendorData), 'vendor.created');

				expect(algoliaService.createObject).toHaveBeenCalledWith('vendor', {
					...vendorData,
					_geoloc: {
						lat: 40.7128,
						lng: -74.006,
					},
				});
			});

			it('should handle vendor created without location', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: null,
					long: null,
				});

				algoliaService.createObject.mockResolvedValue({ objectID: 'vendor_123' });

				await service.processVendorEvent(createBaseEvent(vendorData), 'vendor.created');

				expect(algoliaService.createObject).toHaveBeenCalledWith('vendor', vendorData);
			});

			it('should handle vendor created with partial location', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: 40.7128,
					long: null,
				});

				algoliaService.createObject.mockResolvedValue({ objectID: 'vendor_123' });

				await service.processVendorEvent(createBaseEvent(vendorData), 'vendor.created');

				expect(algoliaService.createObject).toHaveBeenCalledWith('vendor', vendorData);
			});

			it('should handle algolia service errors gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				const algoliaError = errors.database('Algolia service unavailable');
				algoliaService.createObject.mockRejectedValue(algoliaError);

				// Should throw error since retryOperation doesn't handle errors gracefully
				await expect(service.processVendorEvent(createBaseEvent(vendorData), 'vendor.created')).rejects.toThrow(
					'Algolia service unavailable',
				);
			});
		});

		describe('vendor.updated', () => {
			it('should handle vendor updated event successfully', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: 40.7128,
					long: -74.006,
				});

				algoliaService.updateObject.mockResolvedValue({ objectID: 'vendor_123' });

				await service.processVendorEvent(createBaseEvent(vendorData), 'vendor.updated');

				expect(algoliaService.updateObject).toHaveBeenCalledWith('vendor', 'vendor_123', {
					_geoloc: {
						lat: 40.7128,
						lng: -74.006,
					},
					createdAt: expect.any(String),
					description: 'Test Description',
					email: 'vendor@example.com',
					id: 'vendor_123',
					imageUrl: 'https://example.com/image.jpg',
					name: 'Test Vendor',
					open: true,
					phone: '123-456-7890',
					updatedAt: expect.any(String),
					website: 'https://example.com',
				});
			});

			it('should handle vendor updated without location', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: null,
					long: null,
				});

				algoliaService.updateObject.mockResolvedValue({ objectID: 'vendor_123' });

				await service.processVendorEvent(createBaseEvent(vendorData), 'vendor.updated');

				expect(algoliaService.updateObject).toHaveBeenCalledWith('vendor', 'vendor_123', {
					createdAt: expect.any(String),
					description: 'Test Description',
					email: 'vendor@example.com',
					id: 'vendor_123',
					imageUrl: 'https://example.com/image.jpg',
					name: 'Test Vendor',
					open: true,
					phone: '123-456-7890',
					updatedAt: expect.any(String),
					website: 'https://example.com',
				});
			});

			it('should handle algolia service errors gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				const algoliaError = errors.database('Algolia service unavailable');
				algoliaService.updateObject.mockRejectedValue(algoliaError);

				await expect(service.processVendorEvent(createBaseEvent(vendorData), 'vendor.updated')).rejects.toThrow(
					'Algolia service unavailable',
				);
			});
		});

		describe('vendor.deleted', () => {
			it('should handle vendor deleted event successfully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });

				algoliaService.deleteObject.mockResolvedValue({ deletedAt: new Date() });

				await service.processVendorEvent(createBaseEvent(vendorData), 'vendor.deleted');

				expect(algoliaService.deleteObject).toHaveBeenCalledWith('vendor', 'vendor_123');
			});

			it('should handle algolia service errors gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				const algoliaError = errors.database('Algolia service unavailable');
				algoliaService.deleteObject.mockRejectedValue(algoliaError);

				await expect(service.processVendorEvent(createBaseEvent(vendorData), 'vendor.deleted')).rejects.toThrow(
					'Algolia service unavailable',
				);
			});
		});

		describe('vendor.location.updated', () => {
			it('should ignore vendor location updated event (not supported)', async () => {
				const locationData = {
					entityId: 'vendor_123',
					location: {
						lat: 40.7128,
						long: -74.006,
					},
				};

				await service.processVendorEvent(createBaseEvent(locationData), 'vendor.location.updated');

				expect(algoliaService.updateObject).not.toHaveBeenCalled();
			});
		});

		describe('unknown event types', () => {
			it('should ignore unknown event types', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });

				await service.processVendorEvent(createBaseEvent(vendorData), 'unknown.event' as any);

				expect(algoliaService.createObject).not.toHaveBeenCalled();
				expect(algoliaService.updateObject).not.toHaveBeenCalled();
				expect(algoliaService.deleteObject).not.toHaveBeenCalled();
			});
		});

		describe('event handler errors', () => {
			it('should handle errors in event processing gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				algoliaService.createObject.mockRejectedValue(new Error('Unexpected error'));

				// Should throw error since retryOperation doesn't handle errors gracefully
				await expect(service.processVendorEvent(createBaseEvent(vendorData), 'vendor.created')).rejects.toThrow(
					'Unexpected error',
				);
			});
		});
	});
});

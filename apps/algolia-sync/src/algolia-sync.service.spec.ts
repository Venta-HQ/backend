import { clearMocks, data, errors, mockEvents } from '../../../test/helpers/test-utils';
import { AlgoliaSyncService } from './algolia-sync.service';

// Mock the retry utility
vi.mock('@app/utils', () => ({
	retryOperation: vi.fn().mockImplementation(async (operation: () => Promise<any>) => {
		return await operation();
	}),
}));

describe('AlgoliaSyncService', () => {
	let service: AlgoliaSyncService;
	let algoliaService: any;
	let eventsService: any;

	beforeEach(() => {
		algoliaService = {
			createObject: vi.fn(),
			deleteObject: vi.fn(),
			updateObject: vi.fn(),
		};
		eventsService = mockEvents();
		service = new AlgoliaSyncService(algoliaService, eventsService);
	});

	afterEach(() => {
		clearMocks();
	});

	describe('onModuleInit', () => {
		it('should setup event listeners', async () => {
			const mockStream = { id: 'test-stream' };
			eventsService.subscribeToStream.mockResolvedValue(mockStream);

			await service.onModuleInit();

			expect(eventsService.subscribeToStream).toHaveBeenCalledWith(
				{
					eventTypes: ['vendor.created', 'vendor.updated', 'vendor.deleted', 'vendor.location.updated'],
					groupName: 'algolia-sync',
					streamName: 'algolia-sync-vendor-events',
				},
				expect.any(Function),
			);
		});
	});

	describe('onModuleDestroy', () => {
		it('should unsubscribe from event stream', async () => {
			const mockStream = { id: 'test-stream' };
			eventsService.subscribeToStream.mockResolvedValue(mockStream);

			await service.onModuleInit();
			await service.onModuleDestroy();

			expect(eventsService.unsubscribeFromStream).toHaveBeenCalledWith(mockStream);
		});

		it('should not unsubscribe if no stream exists', async () => {
			await service.onModuleDestroy();

			expect(eventsService.unsubscribeFromStream).not.toHaveBeenCalled();
		});
	});

	describe('Event Handling', () => {
		let eventHandler: () => Promise<void>;
		let mockStream: any;

		beforeEach(async () => {
			mockStream = { id: 'test-stream' };
			eventsService.subscribeToStream.mockResolvedValue(mockStream);

			await service.onModuleInit();

			// Capture the event handler function
			eventHandler = eventsService.subscribeToStream.mock.calls[0][1];
		});

		describe('vendor.created', () => {
			it('should handle vendor created event successfully', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: 40.7128,
					long: -74.006,
				});

				algoliaService.createObject.mockResolvedValue({ objectID: 'vendor_123' });

				await eventHandler({ data: vendorData, type: 'vendor.created' });

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

				await eventHandler({ data: vendorData, type: 'vendor.created' });

				expect(algoliaService.createObject).toHaveBeenCalledWith('vendor', vendorData);
			});

			it('should handle vendor created with partial location', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: 40.7128,
					long: null,
				});

				algoliaService.createObject.mockResolvedValue({ objectID: 'vendor_123' });

				await eventHandler({ data: vendorData, type: 'vendor.created' });

				expect(algoliaService.createObject).toHaveBeenCalledWith('vendor', vendorData);
			});

			it('should handle algolia service errors gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				const algoliaError = errors.database('Algolia service unavailable');
				algoliaService.createObject.mockRejectedValue(algoliaError);

				// Should not throw error, just log it
				await expect(eventHandler({ data: vendorData, type: 'vendor.created' })).resolves.not.toThrow();
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

				await eventHandler({ data: vendorData, type: 'vendor.updated' });

				expect(algoliaService.updateObject).toHaveBeenCalledWith('vendor', 'vendor_123', {
					...vendorData,
					_geoloc: {
						lat: 40.7128,
						lng: -74.006,
					},
				});
			});

			it('should handle vendor updated without location', async () => {
				const vendorData = data.vendor({
					id: 'vendor_123',
					lat: null,
					long: null,
				});

				algoliaService.updateObject.mockResolvedValue({ objectID: 'vendor_123' });

				await eventHandler({ data: vendorData, type: 'vendor.updated' });

				expect(algoliaService.updateObject).toHaveBeenCalledWith('vendor', 'vendor_123', vendorData);
			});

			it('should handle algolia service errors gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				const algoliaError = errors.database('Algolia service unavailable');
				algoliaService.updateObject.mockRejectedValue(algoliaError);

				await expect(eventHandler({ data: vendorData, type: 'vendor.updated' })).resolves.not.toThrow();
			});
		});

		describe('vendor.deleted', () => {
			it('should handle vendor deleted event successfully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });

				algoliaService.deleteObject.mockResolvedValue({ deletedAt: new Date() });

				await eventHandler({ data: vendorData, type: 'vendor.deleted' });

				expect(algoliaService.deleteObject).toHaveBeenCalledWith('vendor', 'vendor_123');
			});

			it('should handle algolia service errors gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				const algoliaError = errors.database('Algolia service unavailable');
				algoliaService.deleteObject.mockRejectedValue(algoliaError);

				await expect(eventHandler({ data: vendorData, type: 'vendor.deleted' })).resolves.not.toThrow();
			});
		});

		describe('vendor.location.updated', () => {
			it('should handle vendor location updated event successfully', async () => {
				const locationData = {
					entityId: 'vendor_123',
					location: {
						lat: 40.7128,
						long: -74.006,
					},
				};

				algoliaService.updateObject.mockResolvedValue({ objectID: 'vendor_123' });

				await eventHandler({ data: locationData, type: 'vendor.location.updated' });

				expect(algoliaService.updateObject).toHaveBeenCalledWith('vendor', 'vendor_123', {
					_geoloc: {
						lat: 40.7128,
						lng: -74.006,
					},
				});
			});

			it('should handle algolia service errors gracefully', async () => {
				const locationData = {
					entityId: 'vendor_123',
					location: {
						lat: 40.7128,
						long: -74.006,
					},
				};
				const algoliaError = errors.database('Algolia service unavailable');
				algoliaService.updateObject.mockRejectedValue(algoliaError);

				await expect(eventHandler({ data: locationData, type: 'vendor.location.updated' })).resolves.not.toThrow();
			});
		});

		describe('unknown event types', () => {
			it('should ignore unknown event types', async () => {
				const unknownEvent = { data: {}, type: 'vendor.unknown' };

				await eventHandler(unknownEvent);

				expect(algoliaService.createObject).not.toHaveBeenCalled();
				expect(algoliaService.updateObject).not.toHaveBeenCalled();
				expect(algoliaService.deleteObject).not.toHaveBeenCalled();
			});
		});

		describe('event handler errors', () => {
			it('should handle errors in event processing gracefully', async () => {
				const vendorData = data.vendor({ id: 'vendor_123' });
				const processingError = new Error('Processing failed');
				algoliaService.createObject.mockRejectedValue(processingError);

				// Should not throw error, just log it
				await expect(eventHandler({ data: vendorData, type: 'vendor.created' })).resolves.not.toThrow();
			});
		});
	});
});

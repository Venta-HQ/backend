import { vi } from 'vitest';
import { VendorLocationEventsController } from './vendor-location-events.controller';
import { VendorService } from './vendor.service';

describe('VendorLocationEventsController', () => {
	let controller: VendorLocationEventsController;
	let vendorService: any;
	let natsQueueService: any;

	beforeEach(() => {
		vendorService = {
			updateVendorLocation: vi.fn(),
		};
		natsQueueService = {
			subscribeToQueue: vi.fn(),
		};
		controller = new VendorLocationEventsController(natsQueueService, vendorService);
	});

	describe('onModuleInit', () => {
		it('should subscribe to vendor location update events', async () => {
			await controller.onModuleInit();

			expect(natsQueueService.subscribeToQueue).toHaveBeenCalledWith(
				'vendor.location.updated',
				'vendor-location-update-workers',
				expect.any(Function),
			);
		});
	});

	describe('handleVendorLocationUpdate', () => {
		it('should handle vendor location update event successfully', async () => {
			const mockEvent = {
				data: {
					eventId: 'event-123',
					data: {
						vendorId: 'vendor-123',
						location: {
							lat: 40.7128,
							long: -74.006,
						},
					},
				},
				subject: 'vendor.location.updated',
			};

			vendorService.updateVendorLocation.mockResolvedValue(undefined);

			await controller['handleVendorLocationUpdate'](mockEvent);

			expect(vendorService.updateVendorLocation).toHaveBeenCalledWith(
				'vendor-123',
				{
					lat: 40.7128,
					long: -74.006,
				},
			);
		});

		it('should handle errors gracefully', async () => {
			const mockEvent = {
				data: {
					eventId: 'event-123',
					data: {
						vendorId: 'vendor-123',
						location: {
							lat: 40.7128,
							long: -74.006,
						},
					},
				},
				subject: 'vendor.location.updated',
			};

			const error = new Error('Service error');
			vendorService.updateVendorLocation.mockRejectedValue(error);

			await expect(controller['handleVendorLocationUpdate'](mockEvent)).rejects.toThrow('Service error');
		});
	});
}); 
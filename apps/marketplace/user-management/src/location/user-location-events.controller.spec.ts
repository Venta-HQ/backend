import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserLocationEventsController } from './user-location-events.controller';

describe('UserLocationEventsController', () => {
	let controller: UserLocationEventsController;
	let mockNatsQueueService: any;
	let mockUserService: any;

	beforeEach(() => {
		mockNatsQueueService = {
			subscribeToQueue: vi.fn(),
		};

		mockUserService = {
			updateUserLocation: vi.fn(),
		};

		controller = new UserLocationEventsController(mockNatsQueueService, mockUserService);
	});

	describe('onModuleInit', () => {
		it('should subscribe to user location update events', async () => {
			await controller.onModuleInit();

			expect(mockNatsQueueService.subscribeToQueue).toHaveBeenCalledWith(
				'location.user_location_updated',
				'user-location-update-workers',
				expect.any(Function),
			);
		});
	});

	describe('handleUserLocationUpdate', () => {
		const mockEvent = {
			data: {
				context: { userId: 'user-123' },
				meta: {
					eventId: 'event-123',
					source: 'test',
					timestamp: '2023-01-01T00:00:00.000Z',
					version: '1.0',
					domain: 'location',
					subdomain: 'user',
				},
				data: {
					userId: 'user-123',
					location: {
						lat: 40.7128,
						lng: -74.006,
					},
				},
			},
			subject: 'location.user_location_updated',
		};

		it('should handle user location update event successfully', async () => {
			mockUserService.updateUserLocation.mockResolvedValue(undefined);

			await controller['handleUserLocationUpdate'](mockEvent);

			expect(mockUserService.updateUserLocation).toHaveBeenCalledWith('user-123', {
				lat: 40.7128,
				long: -74.006,
			});
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			mockUserService.updateUserLocation.mockRejectedValue(serviceError);

			await expect(controller['handleUserLocationUpdate'](mockEvent)).rejects.toThrow('Service error');
		});
	});
});

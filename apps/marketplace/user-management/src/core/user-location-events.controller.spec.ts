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
				'user.location.updated',
				'user-location-update-workers',
				expect.any(Function),
			);
		});
	});

	describe('handleUserLocationUpdate', () => {
		const mockEvent = {
			data: {
				eventId: 'event-123',
				data: {
					userId: 'user-123',
					location: {
						lat: 40.7128,
						long: -74.006,
					},
				},
			},
			subject: 'user.location.updated',
		};

		it('should handle user location update event successfully', async () => {
			mockUserService.updateUserLocation.mockResolvedValue(undefined);

			await controller['handleUserLocationUpdate'](mockEvent);

			expect(mockUserService.updateUserLocation).toHaveBeenCalledWith(
				'user-123',
				{
					lat: 40.7128,
					long: -74.006,
				},
			);
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			mockUserService.updateUserLocation.mockRejectedValue(serviceError);

			await expect(controller['handleUserLocationUpdate'](mockEvent)).rejects.toThrow('Service error');
		});
	});
}); 
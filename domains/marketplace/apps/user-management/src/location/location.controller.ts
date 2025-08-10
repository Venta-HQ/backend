import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsQueueService } from '@venta/nest/modules';
import { LocationService } from './location.service';

/**
 * Location controller for user-management operations
 * NATS consumer for user location update events.
 *
 * This controller automatically extracts correlation IDs from NATS messages
 * using the NatsRequestIdInterceptor (applied at module level), making them
 * available to all log messages.
 */
@Injectable()
export class LocationController implements OnModuleInit {
	private readonly logger = new Logger(LocationController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly locationService: LocationService,
	) {}

	async onModuleInit() {
		// Subscribe to location domain events for user location updates
		this.natsQueueService.subscribeToQueue(
			'location.user.location_updated', // DDD domain event for location updates
			'user-location-update-workers',
			this.handleUserLocationUpdate.bind(this),
		);

		this.logger.log('Location controller initialized with DDD event patterns');
	}

	private async handleUserLocationUpdate(event: any): Promise<void> {
		const { data: eventData, subject } = event;

		// Enhanced logging with domain context
		this.logger.log(`Handling user location event: ${subject}`, {
			context: event.context,
			domain: event.meta.domain,
			eventId: event.meta.eventId,
			subdomain: event.meta.subdomain,
			userId: eventData.userId,
		});

		try {
			await this.locationService.updateUserLocation({
				userId: eventData.userId,
				location: eventData.location,
			});
		} catch (error) {
			this.logger.error(`Failed to handle user location event: ${subject}`, {
				context: event.context,
				error,
				eventId: event.meta.eventId,
				userId: eventData.userId,
			});
			throw error;
		}
	}
}

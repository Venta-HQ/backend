import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseEvent } from '@venta/eventtypes';
import { NatsQueueService } from '@venta/nest/modules';
import { UserService } from '../core/user.service';

/**
 * NATS consumer for user location update events.
 *
 * This controller automatically extracts correlation IDs from NATS messages
 * using the NatsRequestIdInterceptor (applied at module level), making them
 * available to all log messages.
 *
 * The same pattern is automatically applied to all NATS consumers in the system.
 */
@Injectable()
export class UserLocationEventsController implements OnModuleInit {
	private readonly logger = new Logger(UserLocationEventsController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly userService: UserService,
	) {}

	async onModuleInit() {
		// Subscribe to location domain events for user location updates
		this.natsQueueService.subscribeToQueue(
			'location.user.location_updated', // DDD domain event for location updates
			'user-location-update-workers',
			this.handleUserLocationUpdate.bind(this),
		);

		this.logger.log('User location events controller initialized with DDD event patterns');
	}

	private async handleUserLocationUpdate(data: { data: BaseEvent; subject: string }): Promise<void> {
		const { data: event, subject } = data;

		// Enhanced logging with domain context
		this.logger.log(`Handling user location event: ${subject}`, {
			context: event.context,
			domain: event.meta.domain,
			eventId: event.meta.eventId,
			subdomain: event.meta.subdomain,
			userId: event.data.userId,
		});

		try {
			await this.userService.updateUserLocation(event.data.userId, event.data.location);
		} catch (error) {
			this.logger.error(`Failed to handle user location event: ${subject}`, {
				context: event.context,
				error,
				eventId: event.meta.eventId,
				userId: event.data.userId,
			});
			throw error;
		}
	}
}

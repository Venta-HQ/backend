import { BaseEvent } from '@app/apitypes';
import { NatsQueueService } from '@app/nest/modules';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service';

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
		// Set up queue subscription for user location update events
		// This ensures only ONE instance processes each event
		this.natsQueueService.subscribeToQueue(
			'user.location.updated', // Specific event for location updates
			'user-location-update-workers', // Queue group name - all instances share this
			this.handleUserLocationUpdate.bind(this),
		);

		this.logger.log('User location events controller initialized with queue groups');
	}

	private async handleUserLocationUpdate(data: { data: BaseEvent; subject: string }): Promise<void> {
		const { data: event, subject } = data;

		// Correlation ID is automatically available in logs via the app-level interceptor
		this.logger.log(`Handling ${subject} event: ${event.eventId} for user: ${event.data.userId}`);

		try {
			await this.userService.updateUserLocation(event.data.userId, event.data.location);
		} catch (error) {
			this.logger.error(`Failed to handle ${subject} event: ${event.eventId} for user ${event.data.userId}:`, error);
			throw error;
		}
	}
}

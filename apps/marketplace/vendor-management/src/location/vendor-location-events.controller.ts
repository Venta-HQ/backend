import { BaseEvent } from '@app/eventtypes';
import { NatsQueueService } from '@app/nest/modules';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VendorService } from '../core/vendor.service';

/**
 * NATS consumer for vendor location update events.
 *
 * This controller automatically extracts correlation IDs from NATS messages
 * using the NatsRequestIdInterceptor (applied at module level), making them
 * available to all log messages.
 *
 * The same pattern is automatically applied to all NATS consumers in the system.
 */
@Injectable()
export class VendorLocationEventsController implements OnModuleInit {
	private readonly logger = new Logger(VendorLocationEventsController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly vendorService: VendorService,
	) {}

	async onModuleInit() {
		// Set up queue subscription for vendor location update events
		// This ensures only ONE instance processes each event
		this.natsQueueService.subscribeToQueue(
			'vendor.location.updated', // Specific event for location updates
			'vendor-location-update-workers', // Queue group name - all instances share this
			this.handleVendorLocationUpdate.bind(this),
		);

		this.logger.log('Vendor location events controller initialized with queue groups');
	}

	private async handleVendorLocationUpdate(data: { data: BaseEvent; subject: string }): Promise<void> {
		const { data: event, subject } = data;
		// Correlation ID is automatically available in logs via the app-level interceptor
		this.logger.log(`Handling ${subject} event: ${event.eventId} for vendor: ${event.data.vendorId}`);

		try {
			await this.vendorService.updateVendorLocation(event.data.vendorId, event.data.location);
		} catch (error) {
			this.logger.error(
				`Failed to handle ${subject} event: ${event.eventId} for vendor ${event.data.vendorId}:`,
				error,
			);
			throw error;
		}
	}
}

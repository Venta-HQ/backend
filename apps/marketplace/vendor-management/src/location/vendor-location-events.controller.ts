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
			'location.vendor_location_updated', // DDD domain event for location updates
			'vendor-location-update-workers', // Queue group name - all instances share this
			this.handleVendorLocationUpdate.bind(this),
		);

		this.logger.log('Vendor location events controller initialized with DDD event patterns');
	}

	private async handleVendorLocationUpdate(data: { data: BaseEvent; subject: string }): Promise<void> {
		const { data: event, subject } = data;
		// Enhanced logging with domain context
		this.logger.log(`Handling vendor location event: ${subject}`, {
			context: event.context,
			domain: event.meta.domain,
			eventId: event.meta.eventId,
			subdomain: event.meta.subdomain,
			vendorId: event.data.vendorId,
		});

		try {
			await this.vendorService.updateVendorLocation(event.data.vendorId, event.data.location);
		} catch (error) {
			this.logger.error(`Failed to handle vendor location event: ${subject}`, {
				context: event.context,
				error,
				eventId: event.meta.eventId,
				vendorId: event.data.vendorId,
			});
			throw error;
		}
	}
}

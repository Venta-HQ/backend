import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventDataMap } from '@venta/eventtypes';
import { Logger, NatsQueueService } from '@venta/nest/modules';
import { LocationService } from './location.service';

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
export class LocationController implements OnModuleInit {
	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly locationService: LocationService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(LocationController.name);
	}

	async onModuleInit() {
		// Set up queue subscription for vendor location update events
		// This ensures only ONE instance processes each event
		this.natsQueueService.subscribeToQueue(
			'location.vendor.location_updated', // DDD domain event for location updates
			'vendor-location-update-workers', // Queue group name - all instances share this
			this.handleVendorLocationUpdate.bind(this),
		);

		this.logger.log('Vendor location events controller initialized with DDD event patterns');
	}

	private async handleVendorLocationUpdate(data: EventDataMap['location.vendor.location_updated']): Promise<void> {
		const { vendorId, location, timestamp } = data;
		// Enhanced logging with domain context
		this.logger.log(`Handling vendor location event: location.vendor.location_updated`, {
			vendorId,
			location,
			timestamp,
		});

		try {
			await this.locationService.updateVendorLocation(vendorId, {
				lat: location.lat,
				lng: location.lng,
			});
		} catch (error) {
			this.logger.error(
				`Failed to handle vendor location event: location.vendor.location_updated`,
				error instanceof Error ? error.stack : undefined,
				{ error: error instanceof Error ? error.message : 'Unknown error', vendorId },
			);
			throw error;
		}
	}
}

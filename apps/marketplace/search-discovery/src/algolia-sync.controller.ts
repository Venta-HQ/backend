import { BaseEvent } from '@app/eventtypes';
import { NatsQueueService } from '@app/nest/modules';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

/**
 * NATS consumer for Algolia sync operations.
 *
 * This controller automatically extracts correlation IDs from NATS messages
 * using the NatsRequestIdInterceptor (applied at module level), making them
 * available to all log messages.
 *
 * The same pattern is automatically applied to all NATS consumers in the system.
 */
@Injectable()
export class AlgoliaSyncController implements OnModuleInit {
	private readonly logger = new Logger(AlgoliaSyncController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly algoliaSyncService: AlgoliaSyncService,
	) {}

	async onModuleInit() {
		// Subscribe to marketplace domain events
		this.natsQueueService.subscribeToQueue(
			'marketplace.vendor_>', // Wildcard for marketplace vendor events
			'algolia-sync-workers',
			this.handleMarketplaceVendorEvent.bind(this),
		);

		// Subscribe to location domain events
		this.natsQueueService.subscribeToQueue(
			'location.vendor_>', // Wildcard for location vendor events
			'algolia-sync-workers',
			this.handleLocationVendorEvent.bind(this),
		);

		this.logger.log('Algolia sync controller initialized with DDD event patterns');
	}

	private async handleMarketplaceVendorEvent(data: { data: BaseEvent; subject: string }): Promise<void> {
		const { data: event, subject } = data;

		// Enhanced logging with domain context
		this.logger.log(`Handling marketplace vendor event: ${subject}`, {
			context: event.context,
			domain: event.meta.domain,
			eventId: event.meta.eventId,
			subdomain: event.meta.subdomain,
			vendorId: event.data.vendorId,
		});

		try {
			switch (subject) {
				case 'marketplace.vendor_onboarded':
					await this.algoliaSyncService.indexNewVendor(event.data);
					break;
				case 'marketplace.vendor_profile_updated':
					await this.algoliaSyncService.updateVendorIndex(event.data);
					break;
				case 'marketplace.vendor_deactivated':
					await this.algoliaSyncService.removeVendorFromIndex(event.data);
					break;
				default:
					this.logger.warn(`Unhandled marketplace vendor event: ${subject}`);
			}
		} catch (error) {
			this.logger.error(`Failed to handle marketplace vendor event: ${subject}`, {
				context: event.context,
				error,
				eventId: event.meta.eventId,
			});
			throw error;
		}
	}

	private async handleLocationVendorEvent(data: { data: BaseEvent; subject: string }): Promise<void> {
		const { data: event, subject } = data;

		// Enhanced logging with domain context
		this.logger.log(`Handling location vendor event: ${subject}`, {
			context: event.context,
			domain: event.meta.domain,
			eventId: event.meta.eventId,
			subdomain: event.meta.subdomain,
			vendorId: event.data.vendorId,
		});

		try {
			if (subject === 'location.vendor_location_updated') {
				await this.algoliaSyncService.updateVendorLocation(event.data);
			} else {
				this.logger.warn(`Unhandled location vendor event: ${subject}`);
			}
		} catch (error) {
			this.logger.error(`Failed to handle location vendor event: ${subject}`, {
				context: event.context,
				error,
				eventId: event.meta.eventId,
			});
			throw error;
		}
	}
}

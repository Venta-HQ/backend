import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// Import specific event types instead of namespace
import type { VendorEventDataMap } from '@venta/domains/marketplace/events';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { NatsQueueService } from '@venta/nest/modules';
import { AlgoliaSyncService } from './algolia-sync.service';

/**
 * Controller for handling vendor events and syncing with Algolia
 */
@Injectable()
export class AlgoliaSyncController implements OnModuleInit {
	private readonly logger = new Logger(AlgoliaSyncController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly algoliaSyncService: AlgoliaSyncService,
	) {}

	async onModuleInit() {
		this.logger.debug('Initializing Algolia sync controller');

		try {
			// Subscribe to events (subscription options are predefined and trusted)
			this.natsQueueService.subscribeToQueue(
				'marketplace.vendor.>',
				'algolia-sync-workers',
				this.handleMarketplaceVendorEvent.bind(this),
			);

			// this.natsQueueService.subscribeToQueue(
			// 	'location.vendor.>',
			// 	'algolia-sync-workers',
			// 	this.handleLocationVendorEvent.bind(this),
			// );

			this.logger.debug('Algolia sync controller initialized successfully');
		} catch (error) {
			this.logger.error('Failed to initialize Algolia sync controller', {
				error: error.message,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE, {
				service: 'NATS',
				operation: 'subscription',
				error: error.message,
			});
		}
	}

	private async handleMarketplaceVendorEvent(data: {
		data:
			| VendorEventDataMap['marketplace.vendor.onboarded']
			| VendorEventDataMap['marketplace.vendor.profile_updated']
			| VendorEventDataMap['marketplace.vendor.deactivated'];
		subject: string;
	}): Promise<void> {
		const { data: event, subject } = data;

		this.logger.debug('Processing marketplace vendor event', {
			subject,
			eventId: event.timestamp,
			vendorId: event.vendorId,
		});

		try {
			// Handle event based on type (events from internal NATS are trusted)
			switch (subject) {
				case 'marketplace.vendor.onboarded':
					await this.algoliaSyncService.indexNewVendor(event);
					break;
				case 'marketplace.vendor.profile_updated':
					await this.algoliaSyncService.updateVendorIndex(event);
					break;
				case 'marketplace.vendor.deactivated':
					await this.algoliaSyncService.removeVendorFromIndex(event);
					break;
				default:
					this.logger.warn('Unhandled marketplace vendor event', { subject });
					return;
			}

			this.logger.debug('Index sync completed successfully', {
				subject,
				eventId: event.timestamp,
			});
		} catch (error) {
			this.logger.error('Failed to handle marketplace vendor event', {
				error: error.message,
				subject,
				eventId: event.timestamp,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE, {
				service: 'Algolia',
				operation: 'indexNewVendor',
				subject,
				eventId: event.timestamp,
			});
		}
	}

	// private async handleLocationVendorEvent(data: {
	// 	data: VendorEventDataMap['location.vendor.location_updated'];
	// 	subject: string;
	// }): Promise<void> {
	// 	const { data: event, subject } = data;

	// 	this.logger.debug('Processing location vendor event', {
	// 		subject,
	// 		eventId: event.meta.eventId,
	// 		vendorId: event.data.vendorId,
	// 	});

	// 	try {
	// 		// Handle location update (events from internal NATS are trusted)
	// 		if (subject === 'location.vendor.location_updated') {
	// 			await this.algoliaSyncService.updateVendorLocation(event.data);

	// 			this.logger.debug('Location sync completed successfully', {
	// 				subject,
	// 				eventId: event.meta.eventId,
	// 			});
	// 		} else {
	// 			this.logger.warn('Unhandled location vendor event', { subject });
	// 		}
	// 	} catch (error) {
	// 		this.logger.error('Failed to handle location vendor event', {
	// 			error: error.message,
	// 			subject,
	// 			eventId: event.meta.eventId,
	// 		});

	// 		if (error instanceof AppError) throw error;
	// 		throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE, {
	// 			service: 'Algolia',
	// 			operation: 'updateVendorLocation',
	// 			subject,
	// 			eventId: event.timestamp,
	// 		});
	// 	}
	// }
}

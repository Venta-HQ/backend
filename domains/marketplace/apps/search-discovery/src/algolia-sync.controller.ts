import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { DomainEvent, SubscriptionOptions } from '@venta/domains/marketplace/contracts/types/internal';
// Import specific event types instead of namespace
import type {
	VendorCreated,
	VendorDeleted,
	VendorLocationChanged,
	VendorUpdated,
} from '@venta/domains/marketplace/events';
import { AppError } from '@venta/nest/errors';
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
			// Configure subscriptions
			const marketplaceSubscription: SubscriptionOptions = {
				topic: 'marketplace.vendor.>',
				queue: 'algolia-sync-workers',
				maxInFlight: 100,
				timeout: 30000,
			};

			const locationSubscription: SubscriptionOptions = {
				topic: 'location.vendor.>',
				queue: 'algolia-sync-workers',
				maxInFlight: 100,
				timeout: 30000,
			};

			// Subscribe to events (subscription options are predefined and trusted)
			this.natsQueueService.subscribeToQueue(
				marketplaceSubscription.topic,
				marketplaceSubscription.queue,
				this.handleMarketplaceVendorEvent.bind(this),
			);

			this.natsQueueService.subscribeToQueue(
				locationSubscription.topic,
				locationSubscription.queue,
				this.handleLocationVendorEvent.bind(this),
			);

			this.logger.debug('Algolia sync controller initialized successfully');
		} catch (error) {
			this.logger.error('Failed to initialize Algolia sync controller', {
				error: error.message,
			});

			if (error instanceof AppError) throw error;
			throw AppError.external(ErrorCodes.ERR_EXTERNAL_SERVICE_UNAVAILABLE, {
				service: 'NATS',
				operation: 'subscription',
				error: error.message,
			});
		}
	}

	private async handleMarketplaceVendorEvent(data: {
		data: DomainEvent<VendorCreated | VendorUpdated | VendorDeleted>;
		subject: string;
	}): Promise<void> {
		const { data: event, subject } = data;

		this.logger.debug('Processing marketplace vendor event', {
			subject,
			eventId: event.meta.eventId,
			vendorId: event.data.vendorId,
		});

		try {
			// Handle event based on type (events from internal NATS are trusted)
			switch (subject) {
				case 'marketplace.vendor.onboarded':
					await this.algoliaSyncService.indexNewVendor(event.data);
					break;
				case 'marketplace.vendor.profile_updated':
					await this.algoliaSyncService.updateVendorIndex(event.data);
					break;
				case 'marketplace.vendor.deactivated':
					await this.algoliaSyncService.removeVendorFromIndex(event.data);
					break;
				default:
					this.logger.warn('Unhandled marketplace vendor event', { subject });
					return;
			}

			this.logger.debug('Index sync completed successfully', {
				subject,
				eventId: event.meta.eventId,
			});
		} catch (error) {
			this.logger.error('Failed to handle marketplace vendor event', {
				error: error.message,
				subject,
				eventId: event.meta.eventId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('ALGOLIA_SYNC_FAILED', 'Failed to sync vendor with Algolia', {
				subject,
				eventId: event.meta.eventId,
			});
		}
	}

	private async handleLocationVendorEvent(data: {
		data: DomainEvent<VendorLocationChanged>;
		subject: string;
	}): Promise<void> {
		const { data: event, subject } = data;

		this.logger.debug('Processing location vendor event', {
			subject,
			eventId: event.meta.eventId,
			vendorId: event.data.vendorId,
		});

		try {
			// Handle location update (events from internal NATS are trusted)
			if (subject === 'location.vendor.location_updated') {
				await this.algoliaSyncService.updateVendorLocation(event.data);

				this.logger.debug('Location sync completed successfully', {
					subject,
					eventId: event.meta.eventId,
				});
			} else {
				this.logger.warn('Unhandled location vendor event', { subject });
			}
		} catch (error) {
			this.logger.error('Failed to handle location vendor event', {
				error: error.message,
				subject,
				eventId: event.meta.eventId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('ALGOLIA_SYNC_FAILED', 'Failed to sync vendor location with Algolia', {
				subject,
				eventId: event.meta.eventId,
			});
		}
	}
}

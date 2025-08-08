import { AppError, ErrorCodes } from '@app/nest/errors';
import { NatsQueueService } from '@app/nest/modules';
import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';
import { NatsACL } from './anti-corruption-layers/nats-acl.js';
import { SearchDiscovery } from './types/context-mapping.types';

/**
 * Controller for handling vendor events and syncing with Algolia
 */
@Injectable()
export class AlgoliaSyncController implements OnModuleInit {
	private readonly logger = new Logger(AlgoliaSyncController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly algoliaSyncService: AlgoliaSyncService,
		private readonly natsACL: NatsACL,
	) {}

	async onModuleInit() {
		this.logger.debug('Initializing Algolia sync controller');

		try {
			// Configure subscriptions
			const marketplaceSubscription: SearchDiscovery.Core.SubscriptionOptions = {
				topic: 'marketplace.vendor.>',
				queue: 'algolia-sync-workers',
				maxInFlight: 100,
				timeout: 30000,
			};

			const locationSubscription: SearchDiscovery.Core.SubscriptionOptions = {
				topic: 'location.vendor.>',
				queue: 'algolia-sync-workers',
				maxInFlight: 100,
				timeout: 30000,
			};

			// Validate subscription options
			if (!this.natsACL.validateSubscriptionOptions(marketplaceSubscription)) {
				throw AppError.validation('INVALID_SUBSCRIPTION_OPTIONS', 'Invalid marketplace subscription options');
			}

			if (!this.natsACL.validateSubscriptionOptions(locationSubscription)) {
				throw AppError.validation('INVALID_SUBSCRIPTION_OPTIONS', 'Invalid location subscription options');
			}

			// Subscribe to events
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
			throw AppError.internal('NATS_SUBSCRIPTION_FAILED', 'Failed to initialize NATS subscriptions');
		}
	}

	private async handleMarketplaceVendorEvent(data: {
		data: SearchDiscovery.Core.DomainEvent<
			Marketplace.Events.VendorCreated | Marketplace.Events.VendorUpdated | Marketplace.Events.VendorDeleted
		>;
		subject: string;
	}): Promise<void> {
		const { data: event, subject } = data;

		this.logger.debug('Processing marketplace vendor event', {
			subject,
			eventId: event.meta.eventId,
			vendorId: event.data.vendorId,
		});

		try {
			// Validate event
			if (
				!this.natsACL.validateDomainEvent<
					Marketplace.Events.VendorCreated | Marketplace.Events.VendorUpdated | Marketplace.Events.VendorDeleted
				>(event.data)
			) {
				throw AppError.validation('INVALID_DOMAIN_EVENT', 'Invalid marketplace vendor event', {
					subject,
					eventId: event.meta.eventId,
				});
			}

			// Handle event based on type
			switch (subject) {
				case 'marketplace.vendor.onboarded':
					await this.algoliaSyncService.indexNewVendor(event.data as Marketplace.Events.VendorCreated);
					break;
				case 'marketplace.vendor.profile_updated':
					await this.algoliaSyncService.updateVendorIndex(event.data as Marketplace.Events.VendorUpdated);
					break;
				case 'marketplace.vendor.deactivated':
					await this.algoliaSyncService.removeVendorFromIndex(event.data as Marketplace.Events.VendorDeleted);
					break;
				default:
					this.logger.warn('Unhandled marketplace vendor event', { subject });
					return;
			}

			// Emit sync completed event
			const syncEvent: SearchDiscovery.Events.IndexSyncCompleted = {
				indexName: 'vendor',
				timestamp: new Date().toISOString(),
				recordCount: 1,
				metadata: {
					eventId: event.meta.eventId,
					subject,
				},
			};

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

			// Emit sync failed event
			const syncError: SearchDiscovery.Events.IndexSyncFailed = {
				indexName: 'vendor',
				timestamp: new Date().toISOString(),
				error: {
					code: error instanceof AppError ? error.code : 'ALGOLIA_SERVICE_ERROR',
					message: error.message,
				},
				metadata: {
					eventId: event.meta.eventId,
					subject,
				},
			};

			if (error instanceof AppError) throw error;
			throw AppError.internal('ALGOLIA_SYNC_FAILED', 'Failed to sync vendor with Algolia', {
				subject,
				eventId: event.meta.eventId,
			});
		}
	}

	private async handleLocationVendorEvent(data: {
		data: SearchDiscovery.Core.DomainEvent<Marketplace.Events.VendorLocationChanged>;
		subject: string;
	}): Promise<void> {
		const { data: event, subject } = data;

		this.logger.debug('Processing location vendor event', {
			subject,
			eventId: event.meta.eventId,
			vendorId: event.data.vendorId,
		});

		try {
			// Validate event
			if (
				!this.natsACL.validateDomainEvent<
					Marketplace.Events.VendorCreated | Marketplace.Events.VendorUpdated | Marketplace.Events.VendorDeleted
				>(event.data)
			) {
				throw AppError.validation('INVALID_DOMAIN_EVENT', 'Invalid location vendor event', {
					subject,
					eventId: event.meta.eventId,
				});
			}

			// Handle location update
			if (subject === 'location.vendor.location_updated') {
				await this.algoliaSyncService.updateVendorLocation(event.data);

				// Emit sync completed event
				const syncEvent: SearchDiscovery.Events.IndexSyncCompleted = {
					indexName: 'vendor',
					timestamp: new Date().toISOString(),
					recordCount: 1,
					metadata: {
						eventId: event.meta.eventId,
						subject,
					},
				};

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

			// Emit sync failed event
			const syncError: SearchDiscovery.Events.IndexSyncFailed = {
				indexName: 'vendor',
				timestamp: new Date().toISOString(),
				error: {
					code: error instanceof AppError ? error.code : 'ALGOLIA_SERVICE_ERROR',
					message: error.message,
				},
				metadata: {
					eventId: event.meta.eventId,
					subject,
				},
			};

			if (error instanceof AppError) throw error;
			throw AppError.internal('ALGOLIA_SYNC_FAILED', 'Failed to sync vendor location with Algolia', {
				subject,
				eventId: event.meta.eventId,
			});
		}
	}
}

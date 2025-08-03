import { EventStream, IEventsService } from '@app/events';
import { AlgoliaService } from '@app/search';
import { RetryUtil } from '@app/utils';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AlgoliaSyncService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(AlgoliaSyncService.name);
	private readonly retryUtil: RetryUtil;
	private vendorEventStream: EventStream | null = null;

	constructor(
		private readonly algoliaService: AlgoliaService,
		@Inject('EventsService') private readonly eventsService: IEventsService,
	) {
		this.retryUtil = new RetryUtil({
			logger: this.logger,
			maxRetries: 3,
			retryDelay: 1000,
		});
	}

	async onModuleInit() {
		await this.setupEventListeners();
	}

	async onModuleDestroy() {
		if (this.vendorEventStream) {
			await this.eventsService.unsubscribeFromStream(this.vendorEventStream);
		}
	}

	private async setupEventListeners() {
		this.logger.log('Setting up Algolia sync event listeners');

		// Create a dedicated stream for vendor events
		this.vendorEventStream = await this.eventsService.subscribeToStream(
			{
				streamName: 'algolia-sync-vendor-events',
				eventTypes: ['vendor.created', 'vendor.updated', 'vendor.deleted', 'vendor.location.updated'],
				groupName: 'algolia-sync',
			},
			async (event) => {
				try {
					switch (event.type) {
						case 'vendor.created':
							await this.handleVendorCreated(event.data);
							break;
						case 'vendor.updated':
							await this.handleVendorUpdated(event.data);
							break;
						case 'vendor.deleted':
							await this.handleVendorDeleted(event.data);
							break;
						case 'vendor.location.updated':
							await this.handleVendorLocationUpdated(event.data);
							break;
						default:
							this.logger.debug(`Ignoring event type: ${event.type}`);
					}
				} catch (error) {
					this.logger.error(`Failed to handle event ${event.type}:`, error);
					// Could implement dead letter queue here for failed events
				}
			},
		);

		this.logger.log('Algolia sync event listeners setup complete');
	}

	private async handleVendorCreated(vendor: Record<string, unknown>) {
		await this.retryUtil.retryOperation(
			() =>
				this.algoliaService.createObject('vendor', {
					...vendor,
					...(vendor.lat && vendor.long
						? {
								_geoloc: {
									lat: vendor.lat,
									lng: vendor.long,
								},
							}
						: {}),
				}),
			`Creating vendor in Algolia: ${vendor.id}`,
		);
	}

	private async handleVendorUpdated(vendor: Record<string, unknown>) {
		await this.retryUtil.retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', vendor.id as string, {
					...vendor,
					...(vendor.lat && vendor.long
						? {
								_geoloc: {
									lat: vendor.lat,
									lng: vendor.long,
								},
							}
						: {}),
				}),
			`Updating vendor in Algolia: ${vendor.id}`,
		);
	}

	private async handleVendorDeleted(vendor: Record<string, unknown>) {
		await this.retryUtil.retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id as string),
			`Deleting vendor from Algolia: ${vendor.id}`,
		);
	}

	private async handleVendorLocationUpdated(locationData: Record<string, unknown>) {
		await this.retryUtil.retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', locationData.vendorId as string, {
					_geoloc: {
						lat: (locationData.location as any).lat,
						lng: (locationData.location as any).long,
					},
				}),
			`Updating vendor location in Algolia: ${locationData.vendorId}`,
		);
	}
}

import { IEventsService } from '@app/events';
import { AlgoliaService } from '@app/search';
import { RetryUtil } from '@app/utils';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AlgoliaSyncService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(AlgoliaSyncService.name);
	private readonly retryUtil: RetryUtil;
	private vendorEventStream: any;

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

	private async handleVendorCreated(vendor: any) {
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

	private async handleVendorUpdated(vendor: any) {
		await this.retryUtil.retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', vendor.id, {
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

	private async handleVendorDeleted(vendor: any) {
		await this.retryUtil.retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id),
			`Deleting vendor from Algolia: ${vendor.id}`,
		);
	}

	private async handleVendorLocationUpdated(locationData: any) {
		await this.retryUtil.retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', locationData.vendorId, {
					_geoloc: {
						lat: locationData.location.lat,
						lng: locationData.location.long,
					},
				}),
			`Updating vendor location in Algolia: ${locationData.vendorId}`,
		);
	}
}

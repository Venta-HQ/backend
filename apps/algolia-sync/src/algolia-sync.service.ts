import { LocationUpdateData } from '@app/apitypes';
import { AlgoliaService, EventStream, IEventsService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AlgoliaSyncService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(AlgoliaSyncService.name);
	private vendorEventStream: EventStream | null = null;

	constructor(
		private readonly algoliaService: AlgoliaService,
		@Inject('EventsService') private readonly eventsService: IEventsService,
	) {}

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
				eventTypes: ['vendor.created', 'vendor.updated', 'vendor.deleted', 'vendor.location.updated'],
				groupName: 'algolia-sync',
				streamName: 'algolia-sync-vendor-events',
			},
			async (event) => {
				try {
					switch (event.type) {
						case 'vendor.created':
							await this.handleVendorCreated(event.data as Record<string, unknown>);
							break;
						case 'vendor.updated':
							await this.handleVendorUpdated(event.data as Record<string, unknown>);
							break;
						case 'vendor.deleted':
							await this.handleVendorDeleted(event.data as Record<string, unknown>);
							break;
						case 'vendor.location.updated':
							await this.handleVendorLocationUpdated(event.data as LocationUpdateData);
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
		await retryOperation(
			() =>
				this.algoliaService.createObject('vendor', {
					...vendor,
					...(vendor.lat && vendor.long
						? ({
								_geoloc: {
									lat: vendor.lat,
									lng: vendor.long,
								},
							} as any)
						: {}),
				}),
			`Creating vendor in Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);
	}

	private async handleVendorUpdated(vendor: Record<string, unknown>) {
		await retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', vendor.id as string, {
					...vendor,
					...(vendor.lat && vendor.long
						? ({
								_geoloc: {
									lat: vendor.lat,
									lng: vendor.long,
								},
							} as any)
						: {}),
				}),
			`Updating vendor in Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);
	}

	private async handleVendorDeleted(vendor: Record<string, unknown>) {
		await retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id as string),
			`Deleting vendor from Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);
	}

	private async handleVendorLocationUpdated(locationData: LocationUpdateData) {
		await retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', locationData.entityId, {
					_geoloc: {
						lat: locationData.location.lat,
						lng: locationData.location.long,
					},
				} as any),
			`Updating vendor location in Algolia: ${locationData.entityId}`,
			{ logger: this.logger },
		);
	}
}

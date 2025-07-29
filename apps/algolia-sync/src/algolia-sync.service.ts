import { IEventsService } from '@app/events';
import { AlgoliaService } from '@app/search';
import { RetryUtil } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlgoliaSyncService implements OnModuleInit {
	private readonly logger = new Logger(AlgoliaSyncService.name);
	private readonly retryUtil: RetryUtil;

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

	private async setupEventListeners() {
		this.logger.log('Setting up Algolia sync event listeners');

		await this.eventsService.subscribeToEvents(async (event) => {
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
					default:
						this.logger.debug(`Ignoring event type: ${event.type}`);
				}
			} catch (error) {
				this.logger.error(`Failed to handle event ${event.type}:`, error);
				// Could implement dead letter queue here for failed events
			}
		});
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
}

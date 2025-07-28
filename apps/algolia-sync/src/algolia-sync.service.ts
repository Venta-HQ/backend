import { AlgoliaService, IEventsService } from '@app/nest/modules';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AlgoliaSyncService implements OnModuleInit {
	private readonly logger = new Logger(AlgoliaSyncService.name);
	private readonly maxRetries = 3;
	private readonly retryDelay = 1000; // 1 second

	constructor(
		private readonly algoliaService: AlgoliaService,
		@Inject('EventsService') private readonly eventsService: IEventsService,
	) {}

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
		await this.retryOperation(
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
		await this.retryOperation(
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
		await this.retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id),
			`Deleting vendor from Algolia: ${vendor.id}`,
		);
	}

	private async retryOperation<T>(operation: () => Promise<T>, description: string, retryCount = 0): Promise<T> {
		try {
			this.logger.log(description);
			return await operation();
		} catch (error) {
			if (retryCount < this.maxRetries) {
				const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
				this.logger.warn(
					`${description} failed (attempt ${retryCount + 1}/${this.maxRetries + 1}), retrying in ${delay}ms:`,
					error,
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
				return this.retryOperation(operation, description, retryCount + 1);
			} else {
				this.logger.error(`${description} failed after ${this.maxRetries + 1} attempts:`, error);
				throw error;
			}
		}
	}
}

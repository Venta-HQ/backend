import { AvailableEventSubjects, BaseEvent } from '@app/eventtypes';
import { AlgoliaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

interface VendorData {
	[name: string]: unknown;
	id: string;
	lat?: number;
	long?: number;
}

@Injectable()
export class AlgoliaSyncService {
	private readonly logger = new Logger(AlgoliaSyncService.name);

	constructor(private readonly algoliaService: AlgoliaService) {}

	/**
	 * Process vendor events and sync to Algolia
	 * Events are already validated by the event system, so we focus on business logic
	 */
	async processVendorEvent(event: BaseEvent, subject: AvailableEventSubjects): Promise<void> {
		const { data: vendor, eventId } = event;

		this.logger.log(`Processing ${subject} event: ${eventId} for vendor: ${vendor.id}`);

		try {
			switch (subject) {
				case 'vendor.created':
					await this.handleVendorCreated(vendor);
					break;
				case 'vendor.updated':
					await this.handleVendorUpdated(vendor);
					break;
				case 'vendor.deleted':
					await this.handleVendorDeleted(vendor);
					break;
				default:
					this.logger.warn(`Unknown vendor event: ${subject}`);
			}
		} catch (error) {
			this.logger.error(`Failed to process ${subject} event: ${eventId} for vendor: ${vendor.id}`, error);
			throw error;
		}
	}

	/**
	 * Handle vendor creation in Algolia
	 */
	private async handleVendorCreated(vendor: VendorData): Promise<void> {
		this.logger.log(`Creating vendor in Algolia: ${vendor.id}`);

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
				} as any),
			`Creating vendor in Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully created vendor in Algolia: ${vendor.id}`);
	}

	/**
	 * Handle vendor update in Algolia
	 */
	private async handleVendorUpdated(vendor: VendorData): Promise<void> {
		this.logger.log(`Updating vendor in Algolia: ${vendor.id}`);

		const { lat, long, ...justVendor } = vendor;

		await retryOperation(
			() =>
				this.algoliaService.updateObject(
					'vendor',
					vendor.id as string,
					{
						...justVendor,
						...(lat && long
							? ({
									_geoloc: {
										lat,
										lng: long,
									},
								} as any)
							: {}),
					} as any,
				),
			`Updating vendor in Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully updated vendor in Algolia: ${vendor.id}`);
	}

	/**
	 * Handle vendor deletion in Algolia
	 */
	private async handleVendorDeleted(vendor: VendorData): Promise<void> {
		this.logger.log(`Deleting vendor from Algolia: ${vendor.id}`);

		await retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id as string),
			`Deleting vendor from Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully deleted vendor from Algolia: ${vendor.id}`);
	}
}

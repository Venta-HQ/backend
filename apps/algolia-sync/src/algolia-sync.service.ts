import { BaseEvent, VendorEventSubject } from '@app/apitypes';
import { AlgoliaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlgoliaSyncService {
	private readonly logger = new Logger(AlgoliaSyncService.name);

	constructor(private readonly algoliaService: AlgoliaService) {}

	/**
	 * Process vendor events and sync to Algolia
	 */
	async processVendorEvent(event: BaseEvent, subject: VendorEventSubject): Promise<void> {
		const { data: vendor, eventId } = event;
		this.logger.log(`Processing ${subject} event: ${eventId} for vendor: ${vendor.id}`);

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
	}

	private async handleVendorCreated(vendor: Record<string, unknown>): Promise<void> {
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
	}

	private async handleVendorUpdated(vendor: Record<string, unknown>): Promise<void> {
		await retryOperation(
			() =>
				this.algoliaService.updateObject(
					'vendor',
					vendor.id as string,
					{
						...vendor,
						...(vendor.lat && vendor.long
							? ({
									_geoloc: {
										lat: vendor.lat,
										lng: vendor.long,
									},
								} as any)
							: {}),
					} as any,
				),
			`Updating vendor in Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);
	}

	private async handleVendorDeleted(vendor: Record<string, unknown>): Promise<void> {
		await retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id as string),
			`Deleting vendor from Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);
	}
}

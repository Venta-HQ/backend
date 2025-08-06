import { AvailableEventSubjects, BaseEvent } from '@app/apitypes';
import { AlgoliaService, RequestContextService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlgoliaSyncService {
	private readonly logger = new Logger(AlgoliaSyncService.name);

	constructor(
		private readonly algoliaService: AlgoliaService,
		private readonly requestContextService: RequestContextService,
	) {}

	/**
	 * Process vendor events and sync to Algolia
	 */
	async processVendorEvent(event: BaseEvent, subject: AvailableEventSubjects): Promise<void> {
		const { data: vendor, eventId, correlationId } = event;

		// Log with correlation ID for tracing
		const requestId = correlationId || this.requestContextService.get('requestId');
		this.logger.log(`Processing ${subject} event: ${eventId} for vendor: ${vendor.id}`, { requestId });

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
				this.logger.warn(`Unknown vendor event: ${subject}`, { requestId });
		}
	}

	private async handleVendorCreated(vendor: Record<string, unknown>): Promise<void> {
		const requestId = this.requestContextService.get('requestId');

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

		this.logger.log(`Successfully created vendor in Algolia: ${vendor.id}`, { requestId });
	}

	private async handleVendorUpdated(vendor: Record<string, unknown>): Promise<void> {
		const requestId = this.requestContextService.get('requestId');
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

		this.logger.log(`Successfully updated vendor in Algolia: ${vendor.id}`, { requestId });
	}

	private async handleVendorDeleted(vendor: Record<string, unknown>): Promise<void> {
		const requestId = this.requestContextService.get('requestId');

		await retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id as string),
			`Deleting vendor from Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully deleted vendor from Algolia: ${vendor.id}`, { requestId });
	}
}

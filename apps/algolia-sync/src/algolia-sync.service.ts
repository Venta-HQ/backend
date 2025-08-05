import { LocationUpdateData } from '@app/apitypes';
import { AlgoliaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Injectable()
export class AlgoliaSyncService {
	private readonly logger = new Logger(AlgoliaSyncService.name);

	constructor(private readonly algoliaService: AlgoliaService) {}

	@EventPattern('vendor.created')
	async handleVendorCreated(vendor: Record<string, unknown>) {
		this.logger.log(`Handling vendor.created event for vendor: ${vendor.id}`);
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

	@EventPattern('vendor.updated')
	async handleVendorUpdated(vendor: Record<string, unknown>) {
		this.logger.log(`Handling vendor.updated event for vendor: ${vendor.id}`);
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

	@EventPattern('vendor.deleted')
	async handleVendorDeleted(vendor: Record<string, unknown>) {
		this.logger.log(`Handling vendor.deleted event for vendor: ${vendor.id}`);
		await retryOperation(
			() => this.algoliaService.deleteObject('vendor', vendor.id as string),
			`Deleting vendor from Algolia: ${vendor.id}`,
			{ logger: this.logger },
		);
	}

	@EventPattern('vendor.location.updated')
	async handleVendorLocationUpdated(locationData: LocationUpdateData) {
		this.logger.log(`Handling vendor.location.updated event for vendor: ${locationData.entityId}`);
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

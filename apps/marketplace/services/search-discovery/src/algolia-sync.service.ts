import { AlgoliaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

interface DDDVendorOnboardedData {
	location: { lat: number; lng: number };
	ownerId: string;
	timestamp: string;
	vendorId: string;
}

interface DDDVendorProfileUpdatedData {
	ownerId: string;
	timestamp: string;
	updatedFields: string[];
	vendorId: string;
}

interface DDDVendorDeactivatedData {
	ownerId: string;
	timestamp: string;
	vendorId: string;
}

interface DDDVendorLocationUpdatedData {
	location: { lat: number; lng: number };
	timestamp: string;
	vendorId: string;
}

@Injectable()
export class AlgoliaSyncService {
	private readonly logger = new Logger(AlgoliaSyncService.name);

	constructor(private readonly algoliaService: AlgoliaService) {}

	/**
	 * Handle DDD vendor onboarding event
	 */
	async indexNewVendor(data: DDDVendorOnboardedData): Promise<void> {
		this.logger.log(`Indexing new vendor in Algolia: ${data.vendorId}`);

		await retryOperation(
			() =>
				this.algoliaService.createObject('vendor', {
					_geoloc: {
						lat: data.location.lat,
						lng: data.location.lng,
					},
					objectID: data.vendorId,
				} as any),
			`Indexing new vendor in Algolia: ${data.vendorId}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully indexed new vendor in Algolia: ${data.vendorId}`);
	}

	/**
	 * Handle DDD vendor profile update event
	 */
	async updateVendorIndex(data: DDDVendorProfileUpdatedData): Promise<void> {
		this.logger.log(`Updating vendor index in Algolia: ${data.vendorId}`, {
			updatedFields: data.updatedFields,
		});

		await retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', data.vendorId, {
					lastUpdated: data.timestamp,
					updatedFields: data.updatedFields,
				} as any),
			`Updating vendor index in Algolia: ${data.vendorId}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully updated vendor index in Algolia: ${data.vendorId}`);
	}

	/**
	 * Handle DDD vendor deactivation event
	 */
	async removeVendorFromIndex(data: DDDVendorDeactivatedData): Promise<void> {
		this.logger.log(`Removing vendor from Algolia index: ${data.vendorId}`);

		await retryOperation(
			() => this.algoliaService.deleteObject('vendor', data.vendorId),
			`Removing vendor from Algolia index: ${data.vendorId}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully removed vendor from Algolia index: ${data.vendorId}`);
	}

	/**
	 * Handle DDD vendor location update event
	 */
	async updateVendorLocation(data: DDDVendorLocationUpdatedData): Promise<void> {
		this.logger.log(`Updating vendor location in Algolia: ${data.vendorId}`);

		await retryOperation(
			() =>
				this.algoliaService.updateObject('vendor', data.vendorId, {
					_geoloc: {
						lat: data.location.lat,
						lng: data.location.lng,
					},
					lastLocationUpdate: data.timestamp,
				} as any),
			`Updating vendor location in Algolia: ${data.vendorId}`,
			{ logger: this.logger },
		);

		this.logger.log(`Successfully updated vendor location in Algolia: ${data.vendorId}`);
	}
}

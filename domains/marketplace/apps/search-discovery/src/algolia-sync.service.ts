import { Injectable } from '@nestjs/common';
// Import specific event types instead of namespace
import type { EventDataMap } from '@venta/eventtypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AlgoliaService, Logger } from '@venta/nest/modules';

/**
 * Service for syncing vendor data with Algolia search index
 */
@Injectable()
export class AlgoliaSyncService {
	constructor(
		private readonly algoliaService: AlgoliaService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(AlgoliaSyncService.name);
	}

	/**
	 * Handle vendor creation event
	 */
	async indexNewVendor(event: EventDataMap['marketplace.vendor.onboarded']): Promise<void> {
		this.logger.debug('Processing vendor creation event', {
			vendorId: event.vendorId,
			ownerId: event.ownerId,
		});

		try {
			// Create initial search record for Algolia
			const searchRecord = {
				objectID: event.vendorId, // Algolia requires objectID
				id: event.vendorId,
				name: '', // Will be updated later
				description: '', // Will be updated later
				email: '', // Will be updated later
				isOpen: false,
				ownerId: event.ownerId,
				createdAt: event.timestamp,
				updatedAt: event.timestamp,
			};

			// Index record - use default vendor index
			await this.algoliaService.createObject('vendors', searchRecord);

			this.logger.debug('Vendor indexed successfully', {
				vendorId: event.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to index vendor', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE_ERROR, {
				service: 'Algolia',
				operation: 'indexNewVendor',
				vendorId: event.vendorId,
				error: error.message,
			});
		}
	}

	/**
	 * Handle vendor update event
	 */
	async updateVendorIndex(event: EventDataMap['marketplace.vendor.profile_updated']): Promise<void> {
		this.logger.debug('Processing vendor update event', {
			vendorId: event.vendorId,
			updatedFields: event.updatedFields,
		});

		try {
			// Create update record for Algolia
			const searchRecord = {
				objectID: event.vendorId, // Algolia requires objectID
				id: event.vendorId,
				...event.updatedFields, // Spread the updated fields
				updatedAt: event.timestamp,
			};

			// Update record - use default vendor index
			await this.algoliaService.updateObject('vendors', event.vendorId, searchRecord);

			this.logger.debug('Vendor index updated successfully', {
				vendorId: event.vendorId,
				updatedFields: event.updatedFields,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor index', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE_ERROR, {
				service: 'Algolia',
				operation: 'updateVendorIndex',
				vendorId: event.vendorId,
				error: error.message,
			});
		}
	}

	/**
	 * Handle vendor deletion event
	 */
	async removeVendorFromIndex(event: EventDataMap['marketplace.vendor.deactivated']): Promise<void> {
		this.logger.debug('Processing vendor deletion event', {
			vendorId: event.vendorId,
		});

		try {
			// Delete record - use default vendor index
			await this.algoliaService.deleteObject('vendors', event.vendorId);

			this.logger.debug('Vendor removed from index successfully', {
				vendorId: event.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to remove vendor from index', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE_ERROR, {
				service: 'Algolia',
				operation: 'removeVendorFromIndex',
				vendorId: event.vendorId,
				error: error.message,
			});
		}
	}

	/**
	 * Handle vendor location update event
	 */
	async updateVendorLocation(event: EventDataMap['location.vendor.location_updated']): Promise<void> {
		this.logger.debug('Processing vendor location update event', {
			vendorId: event.vendorId,
			location: event.location,
		});

		try {
			// Create location update record for Algolia
			const searchRecord = {
				objectID: event.vendorId, // Algolia requires objectID
				id: event.vendorId,
				_geoloc: {
					lat: event.location.lat,
					lng: event.location.lng, // Algolia uses 'lng' not 'long'
				},
				updatedAt: event.timestamp,
			};

			// Update record - use default vendor index
			await this.algoliaService.updateObject('vendors', event.vendorId, searchRecord);

			this.logger.debug('Vendor location updated successfully', {
				vendorId: event.vendorId,
				location: {
					lat: event.location.lat,
					lng: event.location.lng,
				},
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_EXTERNAL_SERVICE_ERROR, {
				service: 'Algolia',
				operation: 'updateVendorLocation',
				vendorId: event.vendorId,
				error: error.message,
			});
		}
	}
}

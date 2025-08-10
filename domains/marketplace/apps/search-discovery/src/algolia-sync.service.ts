import { Injectable, Logger } from '@nestjs/common';
import { AlgoliaACL } from '@venta/domains/marketplace/contracts';
import { SearchToMarketplaceContextMapper } from '@venta/domains/marketplace/contracts/context-mappers/search/search-to-marketplace.context-mapper';
import { Marketplace } from '@venta/domains/marketplace/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AlgoliaService } from '@venta/nest/modules';

/**
 * Service for syncing vendor data with Algolia search index
 */
@Injectable()
export class AlgoliaSyncService {
	private readonly logger = new Logger(AlgoliaSyncService.name);

	constructor(
		private readonly algoliaService: AlgoliaService,
		private readonly algoliaACL: AlgoliaACL,
		private readonly contextMapper: SearchToMarketplaceContextMapper,
	) {}

	/**
	 * Handle vendor creation event
	 */
	async indexNewVendor(event: Marketplace.Events.VendorCreated): Promise<void> {
		this.logger.debug('Processing vendor creation event', {
			vendorId: event.vendorId,
			ownerId: event.ownerId,
		});

		try {
			// Create initial search record
			const searchRecord = this.contextMapper.toSearchRecord({
				id: event.vendorId,
				name: '', // Will be updated later
				description: '', // Will be updated later
				email: '', // Will be updated later
				isOpen: false,
				ownerId: event.ownerId,
				createdAt: event.timestamp,
				updatedAt: event.timestamp,
			});

			// Validate record
			if (!this.algoliaACL.validateSearchRecord(searchRecord)) {
				throw AppError.validation(ErrorCodes.ERR_SEARCH_INDEX_INVALID, {
					vendorId: event.vendorId,
				});
			}

			// Index record
			const indexConfig = this.algoliaACL.toAlgoliaIndexConfig('vendor');
			await this.algoliaService.createObject(indexConfig.name, searchRecord);

			this.logger.debug('Vendor indexed successfully', {
				vendorId: event.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to index vendor', {
				error: error.message,
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			this.algoliaACL.handleAlgoliaError(error, {
				operation: 'indexNewVendor',
				vendorId: event.vendorId,
			});
		}
	}

	/**
	 * Handle vendor update event
	 */
	async updateVendorIndex(event: Marketplace.Events.VendorUpdated): Promise<void> {
		this.logger.debug('Processing vendor update event', {
			vendorId: event.vendorId,
			updatedFields: event.updatedFields,
		});

		try {
			// Create update record
			const searchRecord = this.contextMapper.toSearchUpdate({
				id: event.vendorId,
				updatedFields: event.updatedFields,
				timestamp: event.timestamp,
			});

			// Validate record
			if (!this.algoliaACL.validateSearchUpdate(searchRecord)) {
				throw AppError.validation(ErrorCodes.ERR_SEARCH_SYNC_FAILED, {
					vendorId: event.vendorId,
					type: 'vendor',
					id: event.vendorId,
				});
			}

			// Update record
			const indexConfig = this.algoliaACL.toAlgoliaIndexConfig('vendor');
			await this.algoliaService.updateObject(indexConfig.name, event.vendorId, searchRecord);

			this.logger.debug('Vendor index updated successfully', {
				vendorId: event.vendorId,
				updatedFields: event.updatedFields,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor index', {
				error: error.message,
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			this.algoliaACL.handleAlgoliaError(error, {
				operation: 'updateVendorIndex',
				vendorId: event.vendorId,
			});
		}
	}

	/**
	 * Handle vendor deletion event
	 */
	async removeVendorFromIndex(event: Marketplace.Events.VendorDeleted): Promise<void> {
		this.logger.debug('Processing vendor deletion event', {
			vendorId: event.vendorId,
		});

		try {
			// Delete record
			const indexConfig = this.algoliaACL.toAlgoliaIndexConfig('vendor');
			await this.algoliaService.deleteObject(indexConfig.name, event.vendorId);

			this.logger.debug('Vendor removed from index successfully', {
				vendorId: event.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to remove vendor from index', {
				error: error.message,
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			this.algoliaACL.handleAlgoliaError(error, {
				operation: 'removeVendorFromIndex',
				vendorId: event.vendorId,
			});
		}
	}

	/**
	 * Handle vendor location update event
	 */
	async updateVendorLocation(event: Marketplace.Events.VendorLocationChanged): Promise<void> {
		this.logger.debug('Processing vendor location update event', {
			vendorId: event.vendorId,
			location: event.location,
		});

		try {
			// Create location update record
			const searchRecord = this.contextMapper.toLocationUpdate({
				id: event.vendorId,
				location: {
					lat: event.location.lat,
					long: event.location.long,
				},
				timestamp: event.timestamp,
			});

			// Validate record
			if (!this.algoliaACL.validateLocationUpdate(searchRecord)) {
				throw AppError.validation(ErrorCodes.ERR_SEARCH_SYNC_FAILED, {
					vendorId: event.vendorId,
					type: 'vendor',
					id: event.vendorId,
				});
			}

			// Update record
			const indexConfig = this.algoliaACL.toAlgoliaIndexConfig('vendor');
			await this.algoliaService.updateObject(indexConfig.name, event.vendorId, searchRecord);

			this.logger.debug('Vendor location updated successfully', {
				vendorId: event.vendorId,
				location: {
					lat: event.location.lat,
					long: event.location.long,
				},
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				vendorId: event.vendorId,
			});

			if (error instanceof AppError) throw error;
			this.algoliaACL.handleAlgoliaError(error, {
				operation: 'updateVendorLocation',
				vendorId: event.vendorId,
			});
		}
	}
}

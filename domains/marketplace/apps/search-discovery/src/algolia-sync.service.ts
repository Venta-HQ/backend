import { AppError } from '@app/nest/errors';
import { AlgoliaService } from '@app/nest/modules';
import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';
import { AlgoliaACL } from './anti-corruption-layers/algolia-acl';
import { SearchToMarketplaceContextMapper } from './context-mappers/search-to-marketplace-context-mapper';
import { SearchDiscovery } from './types/context-mapping.types';

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
				throw AppError.validation('INVALID_SEARCH_RECORD', 'Invalid vendor search record', {
					vendorId: event.vendorId,
				});
			}

			// Index record
			const indexConfig = this.algoliaACL.toAlgoliaIndexConfig('vendor');
			await this.algoliaService.createObject(indexConfig.name, searchRecord);

			// Emit event
			const syncEvent: SearchDiscovery.Events.VendorIndexed = {
				vendorId: event.vendorId,
				operation: 'create',
				timestamp: new Date().toISOString(),
			};

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
				throw AppError.validation('INVALID_SEARCH_UPDATE', 'Invalid vendor search update', {
					vendorId: event.vendorId,
				});
			}

			// Update record
			const indexConfig = this.algoliaACL.toAlgoliaIndexConfig('vendor');
			await this.algoliaService.updateObject(indexConfig.name, event.vendorId, searchRecord);

			// Emit event
			const syncEvent: SearchDiscovery.Events.VendorIndexed = {
				vendorId: event.vendorId,
				operation: 'update',
				timestamp: new Date().toISOString(),
				updatedFields: event.updatedFields,
			};

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

			// Emit event
			const syncEvent: SearchDiscovery.Events.VendorIndexed = {
				vendorId: event.vendorId,
				operation: 'delete',
				timestamp: new Date().toISOString(),
			};

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
				location: event.location,
				timestamp: event.timestamp,
			});

			// Validate record
			if (!this.algoliaACL.validateLocationUpdate(searchRecord)) {
				throw AppError.validation('INVALID_LOCATION_UPDATE', 'Invalid vendor location update', {
					vendorId: event.vendorId,
				});
			}

			// Update record
			const indexConfig = this.algoliaACL.toAlgoliaIndexConfig('vendor');
			await this.algoliaService.updateObject(indexConfig.name, event.vendorId, searchRecord);

			// Emit event
			const syncEvent: SearchDiscovery.Events.VendorLocationIndexed = {
				vendorId: event.vendorId,
				location: event.location,
				timestamp: new Date().toISOString(),
			};

			this.logger.debug('Vendor location updated successfully', {
				vendorId: event.vendorId,
				location: event.location,
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

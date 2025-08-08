import { AppError } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { SearchDiscovery } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for Algolia integration
 */
@Injectable()
export class AlgoliaACL {
	private readonly logger = new Logger(AlgoliaACL.name);

	private readonly indexConfigs: Record<string, SearchDiscovery.Internal.AlgoliaIndexConfig> = {
		vendor: {
			name: 'vendors',
			settings: {
				searchableAttributes: ['name', 'description', 'email'],
				attributesForFaceting: ['isOpen', 'ownerId'],
				customRanking: ['desc(updatedAt)'],
				replicas: ['vendors_geo'],
			},
		},
	};

	/**
	 * Get Algolia index configuration
	 */
	toAlgoliaIndexConfig(type: string): SearchDiscovery.Internal.AlgoliaIndexConfig {
		const config = this.indexConfigs[type];
		if (!config) {
			throw AppError.validation('INVALID_INDEX_TYPE', 'Invalid Algolia index type', { type });
		}
		return config;
	}

	/**
	 * Validate search record
	 */
	validateSearchRecord(record: unknown): record is SearchDiscovery.Core.SearchRecord {
		try {
			const result = SearchDiscovery.Validation.SearchRecordSchema.safeParse(record);
			return result.success;
		} catch (error) {
			this.logger.error('Failed to validate search record', {
				error: error.message,
				record,
			});
			return false;
		}
	}

	/**
	 * Validate search update
	 */
	validateSearchUpdate(update: unknown): update is SearchDiscovery.Core.SearchUpdate {
		try {
			const result = SearchDiscovery.Validation.SearchUpdateSchema.safeParse(update);
			return result.success;
		} catch (error) {
			this.logger.error('Failed to validate search update', {
				error: error.message,
				update,
			});
			return false;
		}
	}

	/**
	 * Validate location update
	 */
	validateLocationUpdate(update: unknown): update is SearchDiscovery.Core.LocationUpdate {
		try {
			const result = SearchDiscovery.Validation.LocationUpdateSchema.safeParse(update);
			return result.success;
		} catch (error) {
			this.logger.error('Failed to validate location update', {
				error: error.message,
				update,
			});
			return false;
		}
	}

	/**
	 * Handle Algolia error
	 */
	handleAlgoliaError(error: unknown, context: { operation: string; vendorId?: string }): never {
		this.logger.error('Algolia operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			vendorId: context.vendorId,
		});

		throw AppError.internal('ALGOLIA_SERVICE_ERROR', 'Algolia operation failed', context);
	}
}

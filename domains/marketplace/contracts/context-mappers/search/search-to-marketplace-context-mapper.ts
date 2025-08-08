import { SearchDiscovery } from '@domains/marketplace/contracts/types/search/context-mapping.types';
import { Injectable } from '@nestjs/common';

/**
 * Context mapper for translating between Search & Discovery and Marketplace domains
 */
@Injectable()
export class SearchToMarketplaceContextMapper {
	/**
	 * Convert vendor data to search record
	 */
	toSearchRecord(vendor: {
		id: string;
		name: string;
		description?: string;
		email?: string;
		isOpen: boolean;
		ownerId: string;
		createdAt: string;
		updatedAt: string;
	}): SearchDiscovery.Core.SearchRecord {
		return {
			objectID: vendor.id,
			name: vendor.name,
			description: vendor.description,
			email: vendor.email,
			isOpen: vendor.isOpen,
			ownerId: vendor.ownerId,
			createdAt: vendor.createdAt,
			updatedAt: vendor.updatedAt,
		};
	}

	/**
	 * Convert vendor update to search update
	 */
	toSearchUpdate(update: {
		id: string;
		updatedFields: string[];
		timestamp: string;
	}): SearchDiscovery.Core.SearchUpdate {
		return {
			objectID: update.id,
			updatedFields: update.updatedFields,
			timestamp: update.timestamp,
		};
	}

	/**
	 * Convert location update to search location update
	 */
	toLocationUpdate(update: {
		id: string;
		location: {
			lat: number;
			lng: number;
		};
		timestamp: string;
	}): SearchDiscovery.Core.LocationUpdate {
		return {
			objectID: update.id,
			_geoloc: {
				lat: update.location.lat,
				lng: update.location.lng,
			},
			timestamp: update.timestamp,
		};
	}

	/**
	 * Convert search result to vendor data
	 */
	toVendorSearchResult(result: SearchDiscovery.Core.SearchRecord): SearchDiscovery.Contracts.SearchResult {
		return {
			id: result.objectID,
			name: result.name,
			description: result.description,
			email: result.email,
			isOpen: result.isOpen,
			ownerId: result.ownerId,
			location: result._geoloc,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		};
	}
}

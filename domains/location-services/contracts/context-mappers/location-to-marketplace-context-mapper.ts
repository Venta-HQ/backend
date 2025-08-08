import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';
import { LocationServices } from '../types/context-mapping.types';

/**
 * Context Mapper for translating between Location Services and Marketplace domains
 */
@Injectable()
export class LocationToMarketplaceContextMapper {
	private readonly logger = new Logger(LocationToMarketplaceContextMapper.name);

	/**
	 * Convert location services coordinates to marketplace format
	 */
	toMarketplaceLocation(coordinates: LocationServices.Core.Coordinates): Marketplace.Core.Location {
		return {
			lat: coordinates.lat,
			lng: coordinates.lng,
		};
	}

	/**
	 * Convert location services bounds to marketplace format
	 */
	toMarketplaceBounds(bounds: LocationServices.Core.GeospatialBounds): Marketplace.Core.LocationBounds {
		return {
			swBounds: this.toMarketplaceLocation(bounds.sw),
			neBounds: this.toMarketplaceLocation(bounds.ne),
		};
	}

	/**
	 * Convert location services vendor data to marketplace format
	 */
	toMarketplaceVendorLocation(locationData: LocationServices.Core.VendorLocation): Marketplace.Core.VendorLocation {
		return {
			vendorId: locationData.entityId,
			...this.toMarketplaceLocation(locationData.coordinates),
			updatedAt: locationData.updatedAt,
		};
	}

	/**
	 * Convert marketplace location update to location services format
	 */
	fromMarketplaceLocationUpdate(
		update: Marketplace.Contracts.VendorLocationUpdate,
	): LocationServices.Contracts.LocationUpdate {
		return {
			entityId: update.vendorId,
			coordinates: {
				lat: update.location.lat,
				lng: update.location.lng,
			},
			metadata: {
				source: 'vendor',
				timestamp: update.timestamp,
			},
		};
	}
}

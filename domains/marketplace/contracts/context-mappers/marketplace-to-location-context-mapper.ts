import { LocationServices } from '@domains/location-services/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Context Mapper for translating between Marketplace and Location Services domains
 */
@Injectable()
export class MarketplaceToLocationContextMapper {
	private readonly logger = new Logger(MarketplaceToLocationContextMapper.name);

	/**
	 * Convert marketplace vendor location to location services format
	 */
	toLocationServicesVendorUpdate(
		vendorId: string,
		location: Marketplace.Location,
	): LocationServices.Contracts.EntityLocationUpdate {
		return {
			entityId: vendorId,
			entityType: 'vendor',
			coordinates: this.toLocationCoordinates(location),
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Convert marketplace user location to location services format
	 */
	toLocationServicesUserUpdate(
		userId: string,
		location: Marketplace.Location,
	): LocationServices.Contracts.EntityLocationUpdate {
		return {
			entityId: userId,
			entityType: 'user',
			coordinates: this.toLocationCoordinates(location),
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Convert marketplace location bounds to location services format
	 */
	toLocationServicesBounds(bounds: Marketplace.LocationBounds): LocationServices.Contracts.GeospatialBounds {
		return {
			southwest: this.toLocationCoordinates(bounds.swBounds),
			northeast: this.toLocationCoordinates(bounds.neBounds),
		};
	}

	/**
	 * Convert location services vendor data to marketplace format
	 */
	toMarketplaceVendorLocation(locationData: LocationServices.VendorLocation): Marketplace.VendorLocation {
		return {
			vendorId: locationData.vendorId,
			lat: locationData.coordinates.latitude,
			lng: locationData.coordinates.longitude,
			updatedAt: locationData.updatedAt,
		};
	}

	/**
	 * Convert marketplace coordinates to location services format
	 */
	private toLocationCoordinates(location: Marketplace.Location): LocationServices.Coordinates {
		return {
			latitude: location.lat,
			longitude: location.lng,
		};
	}
}

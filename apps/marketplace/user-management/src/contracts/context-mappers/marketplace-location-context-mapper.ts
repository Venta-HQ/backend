import { Injectable, Logger } from '@nestjs/common';
import { 
	MarketplaceLocationBounds, 
	MarketplaceLocationUpdate, 
	MarketplaceVendorLocation, 
	MarketplaceUserLocation 
} from '@app/apitypes/domains/marketplace';

/**
 * Context Mapper for Marketplace ↔ Location Services communication
 * 
 * Translates between Marketplace domain concepts and Location Services domain concepts
 */
@Injectable()
export class MarketplaceLocationContextMapper {
	private readonly logger = new Logger(MarketplaceLocationContextMapper.name);

	// ============================================================================
	// Marketplace → Location Services Translation
	// ============================================================================

	/**
	 * Translate marketplace vendor location update to location services format
	 */
	toLocationServicesVendorUpdate(
		vendorId: string, 
		location: { lat: number; lng: number }
	) {
		this.logger.debug('Translating marketplace vendor location to location services format', {
			vendorId,
			location,
		});

		return {
			entityId: vendorId, // Location Services uses 'entityId'
			coordinates: {
				latitude: location.lat,
				longitude: location.lng,
			},
			trackingStatus: 'active',
			accuracy: 5.0, // Default accuracy
			lastUpdateTime: new Date().toISOString(),
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace user location update to location services format
	 */
	toLocationServicesUserUpdate(
		userId: string, 
		location: { lat: number; lng: number }
	) {
		this.logger.debug('Translating marketplace user location to location services format', {
			userId,
			location,
		});

		return {
			entityId: userId, // Location Services uses 'entityId'
			coordinates: {
				latitude: location.lat,
				longitude: location.lng,
			},
			trackingStatus: 'active',
			accuracy: 5.0, // Default accuracy
			lastUpdateTime: new Date().toISOString(),
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace location bounds to location services format
	 */
	toLocationServicesBounds(bounds: MarketplaceLocationBounds) {
		this.logger.debug('Translating marketplace bounds to location services format', {
			bounds,
		});

		return {
			northEast: {
				latitude: bounds.northEast.lat,
				longitude: bounds.northEast.lng,
			},
			southWest: {
				latitude: bounds.southWest.lat,
				longitude: bounds.southWest.lng,
			},
		};
	}

	/**
	 * Translate marketplace radius search to location services format
	 */
	toLocationServicesRadiusSearch(
		center: { lat: number; lng: number },
		radiusInMeters: number
	) {
		this.logger.debug('Translating marketplace radius search to location services format', {
			center,
			radiusInMeters,
		});

		return {
			center: {
				latitude: center.lat,
				longitude: center.lng,
			},
			radiusInMeters,
			entityType: 'vendor', // Location Services needs to know entity type
		};
	}

	// ============================================================================
	// Location Services → Marketplace Translation
	// ============================================================================

	/**
	 * Translate location services vendor location to marketplace format
	 */
	toMarketplaceVendorLocation(
		locationServicesData: {
			entityId: string;
			coordinates: { latitude: number; longitude: number };
			lastUpdateTime: string;
			accuracy?: number;
		}
	): MarketplaceVendorLocation {
		this.logger.debug('Translating location services vendor location to marketplace format', {
			entityId: locationServicesData.entityId,
		});

		return {
			vendorId: locationServicesData.entityId, // Marketplace uses 'vendorId'
			location: {
				lat: locationServicesData.coordinates.latitude,
				lng: locationServicesData.coordinates.longitude,
			},
			lastUpdated: locationServicesData.lastUpdateTime,
			accuracy: locationServicesData.accuracy || 5.0,
		};
	}

	/**
	 * Translate location services user location to marketplace format
	 */
	toMarketplaceUserLocation(
		locationServicesData: {
			entityId: string;
			coordinates: { latitude: number; longitude: number };
			lastUpdateTime: string;
			accuracy?: number;
		}
	): MarketplaceUserLocation {
		this.logger.debug('Translating location services user location to marketplace format', {
			entityId: locationServicesData.entityId,
		});

		return {
			userId: locationServicesData.entityId, // Marketplace uses 'userId'
			location: {
				lat: locationServicesData.coordinates.latitude,
				lng: locationServicesData.coordinates.longitude,
			},
			lastUpdated: locationServicesData.lastUpdateTime,
			accuracy: locationServicesData.accuracy || 5.0,
		};
	}

	/**
	 * Translate location services location update to marketplace format
	 */
	toMarketplaceLocationUpdate(
		locationServicesData: {
			entityId: string;
			entityType: 'vendor' | 'user';
			coordinates: { latitude: number; longitude: number };
			timestamp: string;
		}
	): MarketplaceLocationUpdate {
		this.logger.debug('Translating location services update to marketplace format', {
			entityId: locationServicesData.entityId,
			entityType: locationServicesData.entityType,
		});

		return {
			entityId: locationServicesData.entityId,
			entityType: locationServicesData.entityType,
			location: {
				lat: locationServicesData.coordinates.latitude,
				lng: locationServicesData.coordinates.longitude,
			},
			timestamp: locationServicesData.timestamp,
		};
	}

	/**
	 * Translate location services vendor list to marketplace format
	 */
	toMarketplaceVendorLocationList(
		locationServicesData: Array<{
			entityId: string;
			coordinates: { latitude: number; longitude: number };
			lastUpdateTime: string;
			accuracy?: number;
		}>
	): MarketplaceVendorLocation[] {
		this.logger.debug('Translating location services vendor list to marketplace format', {
			count: locationServicesData.length,
		});

		return locationServicesData.map(vendor => this.toMarketplaceVendorLocation(vendor));
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate marketplace location data before translation
	 */
	validateMarketplaceLocation(location: { lat: number; lng: number }): boolean {
		const isValid = 
			typeof location.lat === 'number' && 
			location.lat >= -90 && 
			location.lat <= 90 &&
			typeof location.lng === 'number' && 
			location.lng >= -180 && 
			location.lng <= 180;

		if (!isValid) {
			this.logger.warn('Invalid marketplace location data', { location });
		}

		return isValid;
	}

	/**
	 * Validate marketplace bounds data before translation
	 */
	validateMarketplaceBounds(bounds: MarketplaceLocationBounds): boolean {
		const isValid = 
			this.validateMarketplaceLocation(bounds.northEast) &&
			this.validateMarketplaceLocation(bounds.southWest) &&
			bounds.northEast.lat > bounds.southWest.lat &&
			bounds.northEast.lng > bounds.southWest.lng;

		if (!isValid) {
			this.logger.warn('Invalid marketplace bounds data', { bounds });
		}

		return isValid;
	}

	/**
	 * Validate location services response data
	 */
	validateLocationServicesResponse(data: any): boolean {
		const isValid = 
			data &&
			typeof data.entityId === 'string' &&
			data.coordinates &&
			typeof data.coordinates.latitude === 'number' &&
			typeof data.coordinates.longitude === 'number';

		if (!isValid) {
			this.logger.warn('Invalid location services response data', { data });
		}

		return isValid;
	}
} 
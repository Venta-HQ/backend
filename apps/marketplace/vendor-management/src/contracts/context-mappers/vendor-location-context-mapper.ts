import {
	MarketplaceLocationBounds,
	MarketplaceLocationUpdate,
	MarketplaceVendorLocation,
} from '@app/apitypes/domains/marketplace';
import { Injectable } from '@nestjs/common';
import { BaseContextMapper } from '@app/nest/modules/contracts';

/**
 * Context Mapper for Vendor Management ↔ Location Services communication
 *
 * Translates between Vendor Management domain concepts and Location Services domain concepts
 */
@Injectable()
export class VendorLocationContextMapper extends BaseContextMapper {
	constructor() {
		super('VendorLocationContextMapper');
	}

	getDomain(): string {
		return 'marketplace';
	}

	getTargetDomain(): string {
		return 'location-services';
	}

	validateSourceData(data: any): boolean {
		if (data.location) {
			return this.validateLocation(data.location);
		}
		if (data.bounds) {
			return this.validateBounds(data.bounds);
		}
		return true;
	}

	validateTargetData(data: any): boolean {
		return this.validateLocationServicesResponse(data);
	}

	// ============================================================================
	// Marketplace → Location Services Translation
	// ============================================================================

	/**
	 * Translate marketplace vendor location update to location services format
	 */
	toLocationServicesVendorUpdate(vendorId: string, location: { lat: number; lng: number }) {
		this.logTranslationStart('toLocationServicesVendorUpdate', { vendorId, location });

		try {
			if (!this.validateSourceData({ location })) {
				throw this.createValidationError('Invalid vendor location data', { vendorId, location });
			}

			const result = {
				entityId: vendorId, // Location Services uses 'entityId'
				coordinates: this.transformLocationToLatLng(location),
				trackingStatus: 'active',
				accuracy: 5.0, // Default accuracy
				lastUpdateTime: new Date().toISOString(),
				source: 'marketplace',
				entityType: 'vendor',
			};

			this.logTranslationSuccess('toLocationServicesVendorUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toLocationServicesVendorUpdate', error, { vendorId, location });
			throw error;
		}
	}

	/**
	 * Translate marketplace location bounds to location services format
	 */
	toLocationServicesBounds(bounds: MarketplaceLocationBounds) {
		this.logTranslationStart('toLocationServicesBounds', { bounds });

		try {
			if (!this.validateSourceData({ bounds })) {
				throw this.createValidationError('Invalid bounds data', { bounds });
			}

			const result = this.transformBounds(bounds);

			this.logTranslationSuccess('toLocationServicesBounds', result);
			return result;
		} catch (error) {
			this.logTranslationError('toLocationServicesBounds', error, { bounds });
			throw error;
		}
	}

	/**
	 * Translate marketplace radius search to location services format
	 */
	toLocationServicesRadiusSearch(center: { lat: number; lng: number }, radiusInMeters: number) {
		this.logTranslationStart('toLocationServicesRadiusSearch', { center, radiusInMeters });

		try {
			if (!this.validateSourceData({ location: center })) {
				throw this.createValidationError('Invalid center location data', { center, radiusInMeters });
			}

			const result = {
				center: this.transformLocationToLatLng(center),
				radiusInMeters,
				entityType: 'vendor', // Location Services needs to know entity type
			};

			this.logTranslationSuccess('toLocationServicesRadiusSearch', result);
			return result;
		} catch (error) {
			this.logTranslationError('toLocationServicesRadiusSearch', error, { center, radiusInMeters });
			throw error;
		}
	}

	// ============================================================================
	// Location Services → Marketplace Translation
	// ============================================================================

	/**
	 * Translate location services vendor location to marketplace format
	 */
	toMarketplaceVendorLocation(locationServicesData: {
		entityId: string;
		coordinates: { latitude: number; longitude: number };
		lastUpdateTime: string;
		accuracy?: number;
	}): MarketplaceVendorLocation {
		this.logTranslationStart('toMarketplaceVendorLocation', { entityId: locationServicesData.entityId });

		try {
			if (!this.validateTargetData(locationServicesData)) {
				throw this.createValidationError('Invalid location services vendor data', { locationServicesData });
			}

			const result = {
				vendorId: locationServicesData.entityId, // Marketplace uses 'vendorId'
				location: this.transformLatLngToLocation(locationServicesData.coordinates),
				lastUpdated: locationServicesData.lastUpdateTime,
				accuracy: locationServicesData.accuracy || 5.0,
			};

			this.logTranslationSuccess('toMarketplaceVendorLocation', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorLocation', error, { locationServicesData });
			throw error;
		}
	}

	/**
	 * Translate location services location update to marketplace format
	 */
	toMarketplaceLocationUpdate(locationServicesData: {
		entityId: string;
		entityType: 'vendor' | 'user';
		coordinates: { latitude: number; longitude: number };
		timestamp: string;
	}): MarketplaceLocationUpdate {
		this.logTranslationStart('toMarketplaceLocationUpdate', { 
			entityId: locationServicesData.entityId,
			entityType: locationServicesData.entityType,
		});

		try {
			if (!this.validateTargetData(locationServicesData)) {
				throw this.createValidationError('Invalid location services update data', { locationServicesData });
			}

			const result = {
				entityId: locationServicesData.entityId,
				entityType: locationServicesData.entityType,
				location: this.transformLatLngToLocation(locationServicesData.coordinates),
				timestamp: locationServicesData.timestamp,
			};

			this.logTranslationSuccess('toMarketplaceLocationUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceLocationUpdate', error, { locationServicesData });
			throw error;
		}
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
		}>,
	): MarketplaceVendorLocation[] {
		this.logTranslationStart('toMarketplaceVendorLocationList', { count: locationServicesData.length });

		try {
			const result = locationServicesData.map((vendor) => this.toMarketplaceVendorLocation(vendor));

			this.logTranslationSuccess('toMarketplaceVendorLocationList', { count: result.length });
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorLocationList', error, { locationServicesData });
			throw error;
		}
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate location services response data
	 */
	private validateLocationServicesResponse(data: any): boolean {
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
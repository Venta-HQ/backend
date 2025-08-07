import {
	MarketplaceLocationBounds,
	MarketplaceLocationUpdate,
	MarketplaceUserLocation,
	MarketplaceVendorLocation,
} from '@app/apitypes/domains/marketplace';
import { Injectable } from '@nestjs/common';
import { BaseContextMapper, ContractUtils } from '@app/nest/modules/contracts';

/**
 * Context Mapper for Marketplace ↔ Location Services communication
 *
 * Translates between Marketplace domain concepts and Location Services domain concepts
 */
@Injectable()
export class MarketplaceLocationContextMapper extends BaseContextMapper {
	constructor() {
		super('MarketplaceLocationContextMapper');
	}

	getDomain(): string {
		return 'marketplace';
	}

	getTargetDomain(): string {
		return 'location-services';
	}

	validateSourceData(data: any): boolean {
		if (data.location) {
			return ContractUtils.validateLocation(data.location);
		}
		if (data.bounds) {
			return ContractUtils.validateBounds(data.bounds);
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
				coordinates: ContractUtils.transformLocationToLatLng(location),
				trackingStatus: 'active',
				accuracy: 5.0, // Default accuracy
				lastUpdateTime: new Date().toISOString(),
				source: 'marketplace',
			};

			this.logTranslationSuccess('toLocationServicesVendorUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toLocationServicesVendorUpdate', error, { vendorId, location });
			throw error;
		}
	}

	/**
	 * Translate marketplace user location update to location services format
	 */
	toLocationServicesUserUpdate(userId: string, location: { lat: number; lng: number }) {
		this.logTranslationStart('toLocationServicesUserUpdate', { userId, location });

		try {
			if (!this.validateSourceData({ location })) {
				throw this.createValidationError('Invalid user location data', { userId, location });
			}

			const result = {
				entityId: userId, // Location Services uses 'entityId'
				coordinates: ContractUtils.transformLocationToLatLng(location),
				trackingStatus: 'active',
				accuracy: 5.0, // Default accuracy
				lastUpdateTime: new Date().toISOString(),
				source: 'marketplace',
			};

			this.logTranslationSuccess('toLocationServicesUserUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toLocationServicesUserUpdate', error, { userId, location });
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

			const result = ContractUtils.transformBounds(bounds);

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
				center: ContractUtils.transformLocationToLatLng(center),
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
				location: ContractUtils.transformLatLngToLocation(locationServicesData.coordinates),
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
	 * Translate location services user location to marketplace format
	 */
	toMarketplaceUserLocation(locationServicesData: {
		entityId: string;
		coordinates: { latitude: number; longitude: number };
		lastUpdateTime: string;
		accuracy?: number;
	}): MarketplaceUserLocation {
		this.logTranslationStart('toMarketplaceUserLocation', { entityId: locationServicesData.entityId });

		try {
			if (!this.validateTargetData(locationServicesData)) {
				throw this.createValidationError('Invalid location services user data', { locationServicesData });
			}

			const result = {
				userId: locationServicesData.entityId, // Marketplace uses 'userId'
				location: ContractUtils.transformLatLngToLocation(locationServicesData.coordinates),
				lastUpdated: locationServicesData.lastUpdateTime,
				accuracy: locationServicesData.accuracy || 5.0,
			};

			this.logTranslationSuccess('toMarketplaceUserLocation', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceUserLocation', error, { locationServicesData });
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
				location: ContractUtils.transformLatLngToLocation(locationServicesData.coordinates),
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


}

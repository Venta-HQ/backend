import { BaseContextMapper } from '@app/nest/modules/contracts';
import { Injectable } from '@nestjs/common';

/**
 * Location Services → Marketplace Context Mapper
 *
 * Translates data between Location Services and Marketplace domains
 */
@Injectable()
export class LocationMarketplaceContextMapper extends BaseContextMapper {
	constructor() {
		super('LocationMarketplaceContextMapper');
	}

	getDomain(): string {
		return 'location-services';
	}

	getTargetDomain(): string {
		return 'marketplace';
	}

	/**
	 * Translate location services user location to marketplace format
	 */
	toMarketplaceUserLocation(
		userId: string,
		locationData: {
			latitude: number;
			longitude: number;
			timestamp: string;
			accuracy?: number;
		},
	) {
		this.logTranslationStart('toMarketplaceUserLocation', { userId });

		try {
			// Validate source data
			this.validateSourceData(locationData);

			// Transform to marketplace format
			const marketplaceLocation = {
				userId,
				location: {
					lat: locationData.latitude,
					lng: locationData.longitude,
				},
				lastUpdated: locationData.timestamp,
				accuracy: locationData.accuracy || null,
			};

			// Validate target data
			this.validateTargetData(marketplaceLocation);

			this.logTranslationSuccess('toMarketplaceUserLocation', { userId });
			return marketplaceLocation;
		} catch (error) {
			this.logTranslationError('toMarketplaceUserLocation', error, { userId });
			throw error;
		}
	}

	/**
	 * Translate location services vendor location to marketplace format
	 */
	toMarketplaceVendorLocation(
		vendorId: string,
		locationData: {
			latitude: number;
			longitude: number;
			timestamp: string;
			status: string;
		},
	) {
		this.logTranslationStart('toMarketplaceVendorLocation', { vendorId });

		try {
			// Validate source data
			this.validateSourceData(locationData);

			// Transform to marketplace format
			const marketplaceLocation = {
				vendorId,
				location: {
					lat: locationData.latitude,
					lng: locationData.longitude,
				},
				lastUpdated: locationData.timestamp,
				isActive: locationData.status === 'active',
			};

			// Validate target data
			this.validateTargetData(marketplaceLocation);

			this.logTranslationSuccess('toMarketplaceVendorLocation', { vendorId });
			return marketplaceLocation;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorLocation', error, { vendorId });
			throw error;
		}
	}

	/**
	 * Translate marketplace location request to location services format
	 */
	toLocationServicesLocationRequest(
		entityId: string,
		entityType: 'user' | 'vendor',
		locationRequest: {
			lat: number;
			lng: number;
			radius?: number;
		},
	) {
		this.logTranslationStart('toLocationServicesLocationRequest', { entityId, entityType });

		try {
			// Validate source data
			this.validateSourceData(locationRequest);

			// Transform to location services format
			const locationServicesRequest = {
				entityId,
				entityType,
				coordinates: {
					latitude: locationRequest.lat,
					longitude: locationRequest.lng,
				},
				radius: locationRequest.radius || 1000, // Default 1km radius
				timestamp: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(locationServicesRequest);

			this.logTranslationSuccess('toLocationServicesLocationRequest', { entityId, entityType });
			return locationServicesRequest;
		} catch (error) {
			this.logTranslationError('toLocationServicesLocationRequest', error, { entityId, entityType });
			throw error;
		}
	}

	/**
	 * Translate location services proximity results to marketplace format
	 */
	toMarketplaceProximityResults(
		results: {
			entityId: string;
			distance: number;
			coordinates: { latitude: number; longitude: number };
		}[],
	) {
		this.logTranslationStart('toMarketplaceProximityResults', { count: results.length });

		try {
			// Validate source data
			this.validateSourceData(results);

			// Transform to marketplace format
			const marketplaceResults = results.map((result) => ({
				id: result.entityId,
				distance: result.distance,
				location: {
					lat: result.coordinates.latitude,
					lng: result.coordinates.longitude,
				},
			}));

			// Validate target data
			this.validateTargetData(marketplaceResults);

			this.logTranslationSuccess('toMarketplaceProximityResults', { count: results.length });
			return marketplaceResults;
		} catch (error) {
			this.logTranslationError('toMarketplaceProximityResults', error, { count: results.length });
			throw error;
		}
	}

	// ============================================================================
	// ABSTRACT METHOD IMPLEMENTATIONS
	// ============================================================================

	validateSourceData(data: any): boolean {
		if (!data) {
			throw this.createValidationError('Source data is required', { data });
		}

		// Additional validation based on data structure
		if (data.latitude !== undefined && data.longitude !== undefined) {
			if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
				throw this.createValidationError('Invalid coordinate types', { data });
			}
		}

		return true;
	}

	validateTargetData(data: any): boolean {
		if (!data) {
			throw this.createValidationError('Target data is required', { data });
		}

		// Additional validation based on data structure
		if (data.location && (typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number')) {
			throw this.createValidationError('Invalid location format', { data });
		}

		return true;
	}
}

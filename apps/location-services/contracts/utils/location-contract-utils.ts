import { Logger } from '@nestjs/common';

/**
 * Location Services Contract Utilities
 * 
 * Domain-specific utilities for location services contract operations.
 * Contains validation and transformation logic specific to the location services domain.
 */
export class LocationContractUtils {
	private static logger = new Logger('LocationContractUtils');

	// ============================================================================
	// Location Validation & Transformation
	// ============================================================================

	/**
	 * Validate location data for location services
	 */
	static validateLocation(location: { lat: number; lng: number }): boolean {
		const isValid =
			typeof location.lat === 'number' &&
			location.lat >= -90 &&
			location.lat <= 90 &&
			typeof location.lng === 'number' &&
			location.lng >= -180 &&
			location.lng <= 180;

		if (!isValid) {
			this.logger.warn('Invalid location data for location services', { location });
		}

		return isValid;
	}

	/**
	 * Validate bounds data for location services
	 */
	static validateBounds(bounds: {
		northEast: { lat: number; lng: number };
		southWest: { lat: number; lng: number };
	}): boolean {
		const isValid =
			this.validateLocation(bounds.northEast) &&
			this.validateLocation(bounds.southWest) &&
			bounds.northEast.lat > bounds.southWest.lat &&
			bounds.northEast.lng > bounds.southWest.lng;

		if (!isValid) {
			this.logger.warn('Invalid bounds data for location services', { bounds });
		}

		return isValid;
	}

	/**
	 * Transform location format (lat/lng to latitude/longitude) for location services
	 */
	static transformLocationToLatLng(location: { lat: number; lng: number }) {
		return {
			latitude: location.lat,
			longitude: location.lng,
		};
	}

	/**
	 * Transform location format (latitude/longitude to lat/lng) for location services
	 */
	static transformLatLngToLocation(location: { latitude: number; longitude: number }) {
		return {
			lat: location.latitude,
			lng: location.longitude,
		};
	}

	/**
	 * Transform bounds format for location services
	 */
	static transformBounds(bounds: {
		northEast: { lat: number; lng: number };
		southWest: { lat: number; lng: number };
	}) {
		return {
			northEast: this.transformLocationToLatLng(bounds.northEast),
			southWest: this.transformLocationToLatLng(bounds.southWest),
		};
	}

	// ============================================================================
	// Location Services Specific Validation
	// ============================================================================

	/**
	 * Validate location services entity data
	 */
	static validateEntityData(entityData: {
		entityId: string;
		coordinates: { latitude: number; longitude: number };
		trackingStatus?: string;
		accuracy?: number;
	}): boolean {
		const isValid =
			entityData &&
			typeof entityData.entityId === 'string' &&
			entityData.entityId.length > 0 &&
			entityData.coordinates &&
			typeof entityData.coordinates.latitude === 'number' &&
			typeof entityData.coordinates.longitude === 'number' &&
			(!entityData.trackingStatus || typeof entityData.trackingStatus === 'string') &&
			(!entityData.accuracy || typeof entityData.accuracy === 'number');

		if (!isValid) {
			this.logger.warn('Invalid location services entity data', { entityData });
		}

		return isValid;
	}

	/**
	 * Validate location services search parameters
	 */
	static validateSearchParameters(params: {
		center: { lat: number; lng: number };
		radiusInMeters: number;
		entityType?: string;
	}): boolean {
		const isValid =
			params &&
			this.validateLocation(params.center) &&
			typeof params.radiusInMeters === 'number' &&
			params.radiusInMeters > 0 &&
			params.radiusInMeters <= 50000 && // Max 50km radius
			(!params.entityType || typeof params.entityType === 'string');

		if (!isValid) {
			this.logger.warn('Invalid location services search parameters', { params });
		}

		return isValid;
	}
} 
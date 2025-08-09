import { Logger } from '@nestjs/common';
import { ValidationUtils } from '@venta/utils';

/**
 * Location Services Contract Utilities
 *
 * Domain-specific utilities for location services contract operations.
 * Contains validation and transformation logic specific to the location services domain.
 */
export class LocationContractUtils {
	private static logger = new Logger('LocationContractUtils');

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
			ValidationUtils.isValidString(entityData.entityId) &&
			entityData.coordinates &&
			typeof entityData.coordinates.latitude === 'number' &&
			typeof entityData.coordinates.longitude === 'number' &&
			(!entityData.trackingStatus || ValidationUtils.isValidString(entityData.trackingStatus)) &&
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
			ValidationUtils.isValidLocation(params.center) &&
			ValidationUtils.isValidPositiveNumber(params.radiusInMeters) &&
			params.radiusInMeters <= 50000 && // Max 50km radius
			(!params.entityType || ValidationUtils.isValidString(params.entityType));

		if (!isValid) {
			this.logger.warn('Invalid location services search parameters', { params });
		}

		return isValid;
	}
}

import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * Validation utilities for location-services domain ACL validation
 */

/**
 * Validates a required string field
 */
export function validateRequiredString(value: string | undefined, fieldName: string): string {
	if (!value || !value.trim()) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: `${fieldName} is required`,
		});
	}
	return value.trim();
}

/**
 * Validates coordinates object
 */
export function validateCoordinates(
	coords: { lat?: number; lng?: number } | undefined,
	fieldName: string = 'coordinates',
): { lat: number; lng: number } {
	if (!coords) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
			field: fieldName,
			message: 'Coordinates are required',
		});
	}

	if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
		throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
			field: fieldName,
			message: 'Valid coordinates (lat, lng) are required',
		});
	}

	if (coords.lat < -90 || coords.lat > 90) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
			field: `${fieldName}.lat`,
			message: 'Latitude must be between -90 and 90',
		});
	}

	if (coords.lng < -180 || coords.lng > 180) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
			field: `${fieldName}.lng`,
			message: 'Longitude must be between -180 and 180',
		});
	}

	return { lat: coords.lat, lng: coords.lng };
}

/**
 * Validates entity type (user or vendor)
 */
export function validateEntityType(
	entityType: string | undefined,
	fieldName: string = 'entityType',
): 'user' | 'vendor' {
	if (!['user', 'vendor'].includes(entityType as string)) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Entity type must be user or vendor',
		});
	}
	return entityType as 'user' | 'vendor';
}

/**
 * Validates radius for geospatial queries
 */
export function validateRadius(radius: number | undefined, fieldName: string = 'radius'): number {
	if (!radius || radius <= 0) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Valid radius (in meters) is required',
		});
	}
	return radius;
}

/**
 * Validates message payload object
 */
export function validateMessagePayload(payload: any, fieldName: string = 'payload'): Record<string, any> {
	if (!payload || typeof payload !== 'object') {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Message payload is required and must be an object',
		});
	}
	return payload;
}

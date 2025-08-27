import { ZodError, ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '@venta/nest/errors';

export function validateSchema<T>(schema: ZodSchema<T>, data: T): T {
	try {
		return schema.parse(data);
	} catch (error) {
		if (error instanceof ZodError) {
			const formattedErrors = error.errors.map((err) => ({
				message: err.message,
				path: err.path.join('.'),
				code: err.code,
			}));

			const firstError = error.errors[0];
			const field = firstError.path.join('.');

			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field,
				errors: formattedErrors,
			});
		}

		throw AppError.internal(ErrorCodes.ERR_INTERNAL, {
			message: 'Unknown error',
			details: error,
		});
	}
}

/**
 * Ensures a required string value is present and non-empty.
 * Throws a typed AppError when validation fails.
 */
export function ensureRequiredString(value: string | undefined, fieldName: string): string {
	if (!value || !value.trim()) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: `${fieldName} is required`,
		});
	}
	return value.trim();
}

// Domain-agnostic input validators used across services

export function validateRequiredString(value: string | undefined, fieldName: string): string {
	return ensureRequiredString(value, fieldName);
}

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

export function validateRadius(radius: number | undefined, fieldName: string = 'radius'): number {
	if (!radius || radius <= 0) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Valid radius (in meters) is required',
		});
	}
	return radius;
}

export function validateMessagePayload(payload: any, fieldName: string = 'payload'): Record<string, any> {
	if (!payload || typeof payload !== 'object') {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Message payload is required and must be an object',
		});
	}
	return payload as Record<string, any>;
}

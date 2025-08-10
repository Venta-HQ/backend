import { z } from 'zod';
import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * Simple validation utilities that work with gRPC types
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
 * Validates email format
 */
export function validateEmail(value: string | undefined, fieldName: string = 'email'): string {
	const validated = validateRequiredString(value, fieldName);
	if (!validated.includes('@')) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Valid email address is required',
		});
	}
	return validated;
}

/**
 * Validates optional email format
 */
export function validateOptionalEmail(value: string | undefined, fieldName: string = 'email'): string | undefined {
	if (!value) return value;

	if (!value.includes('@')) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Valid email address is required',
		});
	}
	return value;
}

/**
 * Validates coordinates object
 */
export function validateCoordinates(
	coords: { lat?: number; lng?: number } | undefined,
	fieldName: string = 'coordinates',
): { lat: number; lng: number } {
	if (!coords) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Coordinates are required',
		});
	}

	if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Valid coordinates (lat, lng) are required',
		});
	}

	if (coords.lat < -90 || coords.lat > 90) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: `${fieldName}.lat`,
			message: 'Latitude must be between -90 and 90',
		});
	}

	if (coords.lng < -180 || coords.lng > 180) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: `${fieldName}.lng`,
			message: 'Longitude must be between -180 and 180',
		});
	}

	return { lat: coords.lat, lng: coords.lng };
}

/**
 * Validates subscription data
 */
export function validateSubscriptionData(
	data: { eventId?: string; productId?: string; transactionId?: string } | undefined,
): { eventId: string; productId: string; transactionId: string } {
	if (!data) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'data',
			message: 'Subscription data is required',
		});
	}

	const eventId = validateRequiredString(data.eventId, 'data.eventId');
	const productId = validateRequiredString(data.productId, 'data.productId');
	const transactionId = validateRequiredString(data.transactionId, 'data.transactionId');

	return { eventId, productId, transactionId };
}

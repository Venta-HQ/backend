import { AppError, ErrorCodes } from '@venta/nest/errors';
import { ensureRequiredString } from '@venta/utils';

/**
 * Validation utilities for infrastructure domain ACL validation
 */

/**
 * Validates a required string field
 */
export function validateRequiredString(value: string | undefined, fieldName: string): string {
	return ensureRequiredString(value, fieldName);
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
 * Validates file upload object
 */
export function validateFileUpload(file: any): { filename: string; mimetype: string; buffer: Buffer; size: number } {
	if (!file) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'file',
			message: 'File is required',
		});
	}

	if (!file.filename) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'filename',
			message: 'Filename is required',
		});
	}

	if (!file.buffer || !(file.buffer instanceof Buffer)) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'buffer',
			message: 'Valid file buffer is required',
		});
	}

	if (!file.mimetype) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'mimetype',
			message: 'File MIME type is required',
		});
	}

	return {
		filename: file.filename,
		mimetype: file.mimetype,
		buffer: file.buffer,
		size: file.size || file.buffer.length,
	};
}

/**
 * Validates optional upload options object
 */
export function validateUploadOptions(options: any): any {
	if (options && typeof options !== 'object') {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'options',
			message: 'Upload options must be an object',
		});
	}
	return options || {};
}

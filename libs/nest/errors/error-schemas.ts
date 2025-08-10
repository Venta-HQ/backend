/**
 * Error handling system with type-safe data objects
 * TypeScript-first approach: define once, derive everything else
 */

import { ErrorType } from './app-error';

/**
 * Single source of truth: error definitions with code, message, and data type
 */
const ERROR_DEFINITIONS = {
	// User errors
	ERR_USER_NOT_FOUND: {
		message: 'User not found',
		data: {} as { userId: string },
	},
	ERR_USER_EXISTS: {
		message: 'User already exists',
		data: {} as { email: string },
	},
	ERR_USER_INCOMPLETE: {
		message: 'User profile is incomplete',
		data: {} as { fields: string[] },
	},
	ERR_USER_INVALID_DATA: {
		message: 'Invalid user data',
		data: {} as { message: string },
	},

	// Vendor errors
	ERR_VENDOR_NOT_FOUND: {
		message: 'Vendor not found',
		data: {} as { vendorId: string },
	},
	ERR_VENDOR_EXISTS: {
		message: 'Vendor already exists',
		data: {} as { email: string },
	},
	ERR_VENDOR_INCOMPLETE: {
		message: 'Vendor profile is incomplete',
		data: {} as { fields: string[] },
	},
	ERR_VENDOR_UNAUTHORIZED: {
		message: 'User not authorized to manage vendor',
		data: {} as { userId: string; vendorId: string },
	},
	ERR_VENDOR_LIMIT: {
		message: 'User has reached the maximum number of vendors allowed',
		data: {} as { userId: string },
	},

	// Location errors
	ERR_LOC_INVALID_COORDS: {
		message: 'Invalid coordinates',
		data: {} as { lat: number; long: number },
	},
	ERR_LOC_NOT_FOUND: {
		message: 'Location not found',
		data: {} as { vendorId: string },
	},
	ERR_LOC_UPDATE_FAILED: {
		message: 'Failed to update location',
		data: {} as { vendorId: string },
	},

	// Authentication/Authorization
	ERR_UNAUTHORIZED: {
		message: 'Authentication required',
		data: {} as Record<string, never>,
	},
	ERR_INSUFFICIENT_PERMISSIONS: {
		message: 'Insufficient permissions',
		data: {} as Record<string, never>,
	},
	ERR_INVALID_TOKEN: {
		message: 'Invalid authentication token',
		data: {} as Record<string, never>,
	},
	ERR_FORBIDDEN: {
		message: 'Access forbidden',
		data: {} as Record<string, never>,
	},

	// Input validation
	ERR_INVALID_INPUT: {
		message: 'Invalid input',
		data: {} as { message: string },
	},
	ERR_MISSING_FIELD: {
		message: 'Required field is missing',
		data: {} as { field: string },
	},
	ERR_INVALID_EMAIL: {
		message: 'Invalid email format',
		data: {} as { email: string },
	},
	ERR_VALIDATION_FAILED: {
		message: 'Validation failed',
		data: {} as { message: string },
	},

	// Database
	ERR_DB_CONNECTION: {
		message: 'Database connection error',
		data: {} as Record<string, never>,
	},
	ERR_DB_OPERATION: {
		message: 'Database operation failed',
		data: {} as { operation: string },
	},
	ERR_RESOURCE_NOT_FOUND: {
		message: 'Resource not found',
		data: {} as { type: string; id: string },
	},
	ERR_RESOURCE_EXISTS: {
		message: 'Resource already exists',
		data: {} as { type: string; id: string },
	},

	// External services
	ERR_EXTERNAL_SERVICE: {
		message: 'External service error',
		data: {} as { service: string; message: string },
	},
	ERR_SERVICE_UNAVAILABLE: {
		message: 'Service unavailable',
		data: {} as { service: string },
	},
	ERR_SERVICE_TIMEOUT: {
		message: 'Service request timed out',
		data: {} as { service: string },
	},

	// Communication
	ERR_COMM_WEBHOOK_INVALID: {
		message: 'Invalid webhook payload',
		data: {} as { source: string },
	},
	ERR_COMM_WEBHOOK_SIGNATURE: {
		message: 'Invalid webhook signature',
		data: {} as { source: string },
	},

	// General
	ERR_INTERNAL: {
		message: 'Internal server error',
		data: {} as Record<string, never>,
	},
	ERR_UNKNOWN: {
		message: 'Unknown error occurred',
		data: {} as Record<string, never>,
	},
} as const;

// Automatically derive everything else from the single source of truth
export const ErrorCodes = Object.keys(ERROR_DEFINITIONS).reduce(
	(acc, key) => {
		acc[key] = key;
		return acc;
	},
	{} as Record<keyof typeof ERROR_DEFINITIONS, string>,
) as {
	[K in keyof typeof ERROR_DEFINITIONS]: K;
};

export type AvailableErrorCodes = keyof typeof ERROR_DEFINITIONS;

export const ERROR_MESSAGES: Record<AvailableErrorCodes, string> = Object.keys(ERROR_DEFINITIONS).reduce(
	(acc, key) => {
		acc[key as AvailableErrorCodes] = ERROR_DEFINITIONS[key as AvailableErrorCodes].message;
		return acc;
	},
	{} as Record<AvailableErrorCodes, string>,
);

export type ErrorDataMap = {
	[K in AvailableErrorCodes]: (typeof ERROR_DEFINITIONS)[K]['data'];
};

/**
 * App error class with type-safe data objects
 */
export class AppError<T extends AvailableErrorCodes = AvailableErrorCodes> extends Error {
	public readonly errorCode: T;
	public readonly errorType: ErrorType;
	public readonly data: ErrorDataMap[T];

	private constructor(errorType: ErrorType, errorCode: T, data: ErrorDataMap[T]) {
		super(ERROR_MESSAGES[errorCode]);
		this.name = 'AppError';
		this.errorCode = errorCode;
		this.errorType = errorType;
		this.data = data;
		Object.setPrototypeOf(this, AppError.prototype);
	}

	// Static factory methods for clean error creation
	static validation<T extends AvailableErrorCodes>(errorCode: T, data: ErrorDataMap[T]): AppError<T> {
		return new AppError(ErrorType.VALIDATION, errorCode, data);
	}

	static notFound<T extends AvailableErrorCodes>(errorCode: T, data: ErrorDataMap[T]): AppError<T> {
		return new AppError(ErrorType.NOT_FOUND, errorCode, data);
	}

	static unauthorized<T extends AvailableErrorCodes>(errorCode: T, data: ErrorDataMap[T]): AppError<T> {
		return new AppError(ErrorType.UNAUTHORIZED, errorCode, data);
	}

	static forbidden<T extends AvailableErrorCodes>(errorCode: T, data: ErrorDataMap[T]): AppError<T> {
		return new AppError(ErrorType.FORBIDDEN, errorCode, data);
	}

	static internal<T extends AvailableErrorCodes>(errorCode: T, data: ErrorDataMap[T]): AppError<T> {
		return new AppError(ErrorType.INTERNAL, errorCode, data);
	}

	static externalService<T extends AvailableErrorCodes>(errorCode: T, data: ErrorDataMap[T]): AppError<T> {
		return new AppError(ErrorType.EXTERNAL_SERVICE, errorCode, data);
	}
}

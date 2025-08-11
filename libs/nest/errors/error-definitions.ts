/**
 * Error schema definitions and derived types
 * Pure data definitions - no implementation logic
 */

export enum ErrorType {
	INTERNAL = 'INTERNAL',
	NOT_FOUND = 'NOT_FOUND',
	UNAUTHORIZED = 'UNAUTHORIZED',
	VALIDATION = 'VALIDATION',
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
	FORBIDDEN = 'FORBIDDEN',
	RATE_LIMIT = 'RATE_LIMIT',
}

/**
 * Single source of truth: error definitions with code, message, and data type
 * Domain-agnostic approach: generic error codes that work across all domains
 */
const ERROR_DEFINITIONS = {
	// Generic entity operations (essential fields only)
	ERR_ENTITY_NOT_FOUND: {
		message: 'Entity not found',
		data: {} as {
			entityType: string;
			entityId: string;
		},
	},
	ERR_ENTITY_EXISTS: {
		message: 'Entity already exists',
		data: {} as {
			entityType: string;
			identifier: string; // The key that already exists (email, id, etc.)
		},
	},
	ERR_ENTITY_INCOMPLETE: {
		message: 'Entity profile is incomplete',
		data: {} as {
			entityType: string;
			entityId: string;
			missingFields: string[]; // What specific fields are missing
		},
	},
	ERR_ENTITY_INVALID_DATA: {
		message: 'Invalid entity data',
		data: {} as {
			entityType: string;
			field: string; // Which field is invalid
		},
	},
	ERR_ENTITY_UNAUTHORIZED: {
		message: 'User not authorized to access entity',
		data: {} as {
			entityType: string;
			entityId: string;
			userId: string;
		},
	},
	ERR_ENTITY_LIMIT_EXCEEDED: {
		message: 'Entity limit exceeded',
		data: {} as {
			entityType: string;
			userId: string;
		},
	},

	// Generic operations (essential fields only)
	ERR_OPERATION_FAILED: {
		message: 'Operation failed',
		data: {} as {
			operation: string; // What operation failed
		},
	},
	ERR_QUERY_FAILED: {
		message: 'Query operation failed',
		data: {} as {
			operation: string; // What query operation failed
		},
	},
	ERR_REDIS_OPERATION_FAILED: {
		message: 'Redis operation failed',
		data: {} as {
			operation: string; // What Redis operation failed
		},
	},
	ERR_EVENT_OPERATION_FAILED: {
		message: 'Event operation failed',
		data: {} as {
			operation: string; // What event operation failed
		},
	},

	// Authentication/Authorization (essential fields only)
	ERR_UNAUTHORIZED: {
		message: 'Authentication required',
		data: {} as Record<string, any>, // No context needed - just needs auth
	},
	ERR_INSUFFICIENT_PERMISSIONS: {
		message: 'Insufficient permissions',
		data: {} as {
			resource: string; // What resource they tried to access
		},
	},
	ERR_INVALID_TOKEN: {
		message: 'Invalid authentication token',
		data: {} as Record<string, any>, // No context needed
	},
	ERR_FORBIDDEN: {
		message: 'Access forbidden',
		data: {} as Record<string, any>, // No context needed
	},

	// Input validation (essential fields only)
	ERR_INVALID_INPUT: {
		message: 'Invalid input',
		data: {} as {
			field: string; // Which field is invalid
		},
	},
	ERR_MISSING_FIELD: {
		message: 'Required field is missing',
		data: {} as {
			field: string; // Which field is missing
		},
	},
	ERR_VALIDATION_FAILED: {
		message: 'Validation failed',
		data: {} as {
			field: string; // Which field failed validation
		},
	},
	ERR_INVALID_COORDINATES: {
		message: 'Invalid coordinates provided',
		data: {} as {
			field: string; // Which coordinate field is invalid (lat/lng/bounds)
		},
	},

	// Rate limiting (essential fields only)
	ERR_RATE_LIMIT_EXCEEDED: {
		message: 'Rate limit exceeded',
		data: {} as {
			retryAfterSeconds: number; // When they can try again
		},
	},

	// WebSocket operations (essential fields only)
	ERR_WEBSOCKET_ERROR: {
		message: 'WebSocket operation failed',
		data: {} as {
			operation: string; // What WebSocket operation failed
		},
	},

	// Database (essential fields only)
	ERR_DB_CONNECTION: {
		message: 'Database connection error',
		data: {} as Record<string, any>, // No context needed
	},
	ERR_DB_OPERATION: {
		message: 'Database operation failed',
		data: {} as {
			operation: string; // What database operation failed
		},
	},

	// Generic resource operations (essential fields only)
	ERR_RESOURCE_NOT_FOUND: {
		message: 'Resource not found',
		data: {} as {
			resourceType: string; // What type of resource (file, image, etc.)
			resourceId: string; // ID/name of the resource
		},
	},
	ERR_RESOURCE_EXISTS: {
		message: 'Resource already exists',
		data: {} as {
			resourceType: string; // What type of resource
			resourceId: string; // ID/name of the existing resource
		},
	},

	// External services (essential fields only)
	ERR_EXTERNAL_SERVICE_ERROR: {
		message: 'External service error',
		data: {} as {
			service: string; // Which external service failed
		},
	},

	// File operations (essential fields only)
	ERR_FILE_OPERATION_FAILED: {
		message: 'File operation failed',
		data: {} as {
			operation: string; // What file operation failed (upload, delete, etc.)
			filename: string; // Which file
		},
	},

	// Communication (essential fields only)
	ERR_WEBHOOK_ERROR: {
		message: 'Webhook operation failed',
		data: {} as {
			source: string; // Which webhook source (clerk, stripe, etc.)
		},
	},
	ERR_NOTIFICATION_FAILED: {
		message: 'Failed to send notification',
		data: {} as {
			recipient: string; // Who we tried to notify
			notificationType: string; // What type of notification
		},
	},

	// General (essential fields only)
	ERR_INTERNAL: {
		message: 'Internal server error',
		data: {} as Record<string, any>, // No context needed - internal errors shouldn't expose details
	},
	ERR_UNKNOWN: {
		message: 'Unknown error occurred',
		data: {} as Record<string, any>, // No context needed - unknown means we don't know what to expose
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
	[K in AvailableErrorCodes]: (typeof ERROR_DEFINITIONS)[K]['data'] & Record<string, any>;
};

/**
 * Conditional type: makes data parameter optional if error requires no data
 */
type IsEmptyObject<T> = T extends Record<string, any> ? true : false;

export type OptionalDataParam<T extends AvailableErrorCodes> =
	IsEmptyObject<ErrorDataMap[T]> extends true
		? [data?: ErrorDataMap[T]] // Optional parameter for empty data
		: [data: ErrorDataMap[T]]; // Required parameter for non-empty data

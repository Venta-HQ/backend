/**
 * Enhanced error handling system with pure TypeScript types.
 * Much simpler than Zod since we only need type information for message interpolation.
 */

/**
 * Base error schema interface
 */
export interface ErrorSchema<T = Record<string, never>> {
	readonly _errorCode: string;
	readonly _message: string;
	readonly _context: T;
}

/**
 * Create an error schema with type information
 */
export function createErrorSchema<T = Record<string, never>>(errorCode: string, message: string): ErrorSchema<T> {
	return {
		_errorCode: errorCode,
		_message: message,
		_context: undefined as any, // Type-only, no runtime value
	};
}

/**
 * Generic/Cross-cutting Error Schemas
 */
export const genericErrorSchemas = {
	// Authentication/Authorization
	ERR_UNAUTHORIZED: createErrorSchema('ERR_UNAUTHORIZED', 'Authentication required'),

	ERR_INSUFFICIENT_PERMISSIONS: createErrorSchema(
		'ERR_INSUFFICIENT_PERMISSIONS',
		'Insufficient permissions to perform this action',
	),

	ERR_INVALID_TOKEN: createErrorSchema('ERR_INVALID_TOKEN', 'Invalid authentication token'),

	ERR_TOKEN_EXPIRED: createErrorSchema('ERR_TOKEN_EXPIRED', 'Authentication token has expired'),

	// Input Validation
	ERR_INVALID_INPUT: createErrorSchema<{ message: string }>('ERR_INVALID_INPUT', 'Invalid input: {message}'),

	ERR_MISSING_FIELD: createErrorSchema<{ field: string }>('ERR_MISSING_FIELD', 'Required field "{field}" is missing'),

	ERR_INVALID_FORMAT: createErrorSchema<{ field: string }>('ERR_INVALID_FORMAT', 'Invalid format for field "{field}"'),

	ERR_INVALID_UUID: createErrorSchema<{ uuid: string }>('ERR_INVALID_UUID', 'Invalid UUID format for "{uuid}"'),

	ERR_INVALID_EMAIL: createErrorSchema<{ email: string }>('ERR_INVALID_EMAIL', 'Invalid email format for "{email}"'),

	ERR_INVALID_PHONE: createErrorSchema<{ phone: string }>(
		'ERR_INVALID_PHONE',
		'Invalid phone number format for "{phone}"',
	),

	ERR_INVALID_COORDINATES: createErrorSchema<{ lat: number; long: number }>(
		'ERR_INVALID_COORDINATES',
		'Invalid coordinates: lat={lat}, long={long}',
	),

	// Database
	ERR_DB_CONNECTION: createErrorSchema('ERR_DB_CONNECTION', 'Database connection error'),

	ERR_DB_OPERATION: createErrorSchema<{ operation: string }>(
		'ERR_DB_OPERATION',
		'Database operation "{operation}" failed',
	),

	ERR_RESOURCE_NOT_FOUND: createErrorSchema<{ type: string; id: string }>(
		'ERR_RESOURCE_NOT_FOUND',
		'Resource of type "{type}" with ID "{id}" not found',
	),

	ERR_RESOURCE_EXISTS: createErrorSchema<{ type: string; id: string }>(
		'ERR_RESOURCE_EXISTS',
		'Resource of type "{type}" with ID "{id}" already exists',
	),

	ERR_DUPLICATE_ENTRY: createErrorSchema<{ field: string; value: string }>(
		'ERR_DUPLICATE_ENTRY',
		'Duplicate entry for field "{field}" with value "{value}"',
	),

	// External Services
	ERR_EXTERNAL_SERVICE: createErrorSchema<{ service: string; message: string }>(
		'ERR_EXTERNAL_SERVICE',
		'External service "{service}" error: {message}',
	),

	ERR_SERVICE_UNAVAILABLE: createErrorSchema<{ service: string }>(
		'ERR_SERVICE_UNAVAILABLE',
		'Service "{service}" is currently unavailable',
	),

	ERR_SERVICE_TIMEOUT: createErrorSchema<{ service: string }>(
		'ERR_SERVICE_TIMEOUT',
		'Service "{service}" request timed out',
	),

	ERR_REDIS_OPERATION_FAILED: createErrorSchema<{ operation: string; errorType: string }>(
		'ERR_REDIS_OPERATION_FAILED',
		'Redis operation "{operation}" failed: {errorType}',
	),

	// Rate Limiting
	ERR_RATE_LIMIT: createErrorSchema<{ seconds: number }>(
		'ERR_RATE_LIMIT',
		'Rate limit exceeded. Try again in {seconds} seconds',
	),

	ERR_TOO_MANY_REQUESTS: createErrorSchema<{ seconds: number }>(
		'ERR_TOO_MANY_REQUESTS',
		'Too many requests. Try again in {seconds} seconds',
	),

	// General
	ERR_INTERNAL: createErrorSchema('ERR_INTERNAL', 'Internal server error'),

	ERR_UNKNOWN: createErrorSchema('ERR_UNKNOWN', 'An unknown error occurred'),
} as const;

/**
 * User Domain Error Schemas
 */
export const userErrorSchemas = {
	ERR_USER_NOT_FOUND: createErrorSchema<{ userId: string }>('ERR_USER_NOT_FOUND', 'User with ID "{userId}" not found'),

	ERR_USER_EXISTS: createErrorSchema<{ email: string }>('ERR_USER_EXISTS', 'User with email "{email}" already exists'),

	ERR_USER_INVALID_DATA: createErrorSchema<{ message: string }>(
		'ERR_USER_INVALID_DATA',
		'Invalid user data: {message}',
	),

	ERR_USER_INCOMPLETE: createErrorSchema<{ fields: string[] }>(
		'ERR_USER_INCOMPLETE',
		'User profile is incomplete. Missing: {fields}',
	),

	ERR_USER_VENDOR_EXISTS: createErrorSchema<{ vendorId: string }>(
		'ERR_USER_VENDOR_EXISTS',
		'User already has a relationship with vendor "{vendorId}"',
	),
} as const;

/**
 * Vendor Domain Error Schemas
 */
export const vendorErrorSchemas = {
	ERR_VENDOR_NOT_FOUND: createErrorSchema<{ vendorId: string }>(
		'ERR_VENDOR_NOT_FOUND',
		'Vendor with ID "{vendorId}" not found',
	),

	ERR_VENDOR_EXISTS: createErrorSchema<{ email: string }>(
		'ERR_VENDOR_EXISTS',
		'Vendor with email "{email}" already exists',
	),

	ERR_VENDOR_INVALID_DATA: createErrorSchema<{ message: string }>(
		'ERR_VENDOR_INVALID_DATA',
		'Invalid vendor data: {message}',
	),

	ERR_VENDOR_INCOMPLETE: createErrorSchema<{ fields: string[] }>(
		'ERR_VENDOR_INCOMPLETE',
		'Vendor profile is incomplete. Missing: {fields}',
	),

	ERR_VENDOR_UNAUTHORIZED: createErrorSchema<{ userId: string; vendorId: string }>(
		'ERR_VENDOR_UNAUTHORIZED',
		'User "{userId}" is not authorized to manage vendor "{vendorId}"',
	),

	ERR_VENDOR_LIMIT: createErrorSchema<{ userId: string }>(
		'ERR_VENDOR_LIMIT',
		'User "{userId}" has reached the maximum number of vendors allowed',
	),
} as const;

/**
 * Location Domain Error Schemas
 */
export const locationErrorSchemas = {
	ERR_LOC_INVALID_COORDS: createErrorSchema<{ lat: number; long: number }>(
		'ERR_LOC_INVALID_COORDS',
		'Invalid coordinates: lat={lat}, long={long}',
	),

	ERR_LOC_NOT_FOUND: createErrorSchema<{ vendorId: string }>(
		'ERR_LOC_NOT_FOUND',
		'Location not found for vendor "{vendorId}"',
	),

	ERR_LOC_UPDATE_FAILED: createErrorSchema<{ vendorId: string }>(
		'ERR_LOC_UPDATE_FAILED',
		'Failed to update location for vendor "{vendorId}"',
	),

	ERR_LOC_QUERY_FAILED: createErrorSchema<{ message: string }>(
		'ERR_LOC_QUERY_FAILED',
		'Location query failed: {message}',
	),

	ERR_LOC_REDIS_FAILED: createErrorSchema<{ operation: string }>(
		'ERR_LOC_REDIS_FAILED',
		'Redis location operation failed: {operation}',
	),
} as const;

/**
 * Communication Domain Error Schemas
 */
export const communicationErrorSchemas = {
	ERR_COMM_WEBHOOK_INVALID: createErrorSchema<{ source: string }>(
		'ERR_COMM_WEBHOOK_INVALID',
		'Invalid webhook payload from "{source}"',
	),

	ERR_COMM_NOTIFICATION_FAILED: createErrorSchema(
		'ERR_COMM_NOTIFICATION_FAILED',
		'Failed to send notification to "{recipient}"',
	),

	ERR_COMM_WEBHOOK_SIGNATURE: createErrorSchema<{ source: string }>(
		'ERR_COMM_WEBHOOK_SIGNATURE',
		'Invalid webhook signature from "{source}"',
	),
} as const;

/**
 * Infrastructure Domain Error Schemas
 */
export const infrastructureErrorSchemas = {
	ERR_INFRA_FILE_NOT_FOUND: createErrorSchema<{ filename: string }>(
		'ERR_INFRA_FILE_NOT_FOUND',
		'File "{filename}" not found',
	),

	ERR_INFRA_UPLOAD_FAILED: createErrorSchema<{ filename: string; message: string }>(
		'ERR_INFRA_UPLOAD_FAILED',
		'Failed to upload file "{filename}": {message}',
	),

	ERR_INFRA_ROUTING_FAILED: createErrorSchema<{ service: string }>(
		'ERR_INFRA_ROUTING_FAILED',
		'Failed to route request to "{service}"',
	),

	ERR_INFRA_GATEWAY_ERROR: createErrorSchema<{ message: string }>(
		'ERR_INFRA_GATEWAY_ERROR',
		'API Gateway error: {message}',
	),
} as const;

/**
 * WebSocket Domain Error Schemas
 */
export const websocketErrorSchemas = {
	ERR_WS_AUTH_FAILED: createErrorSchema<{ userId: string }>(
		'ERR_WS_AUTH_FAILED',
		'WebSocket authentication failed for user "{userId}"',
	),

	ERR_WS_CONNECTION_FAILED: createErrorSchema<{ message: string }>(
		'ERR_WS_CONNECTION_FAILED',
		'WebSocket connection failed: {message}',
	),

	ERR_WS_INVALID_MESSAGE: createErrorSchema<{ message: string }>(
		'ERR_WS_INVALID_MESSAGE',
		'Invalid WebSocket message format: {message}',
	),

	ERR_WS_RATE_LIMIT: createErrorSchema<{ userId: string }>(
		'ERR_WS_RATE_LIMIT',
		'WebSocket rate limit exceeded for user "{userId}"',
	),
} as const;

/**
 * Search Domain Error Schemas
 */
export const searchErrorSchemas = {
	ERR_SEARCH_INDEX_INVALID: createErrorSchema<{ index: string }>(
		'ERR_SEARCH_INDEX_INVALID',
		'Invalid search index "{index}"',
	),

	ERR_SEARCH_SYNC_FAILED: createErrorSchema<{ type: string; id: string }>(
		'ERR_SEARCH_SYNC_FAILED',
		'Failed to sync "{type}" with ID "{id}" to search index',
	),

	ERR_SEARCH_QUERY_FAILED: createErrorSchema<{ message: string }>(
		'ERR_SEARCH_QUERY_FAILED',
		'Search query failed: {message}',
	),
} as const;

/**
 * Subscription Domain Error Schemas
 */
export const subscriptionErrorSchemas = {
	ERR_SUB_NOT_FOUND: createErrorSchema<{ userId: string }>(
		'ERR_SUB_NOT_FOUND',
		'Subscription not found for user "{userId}"',
	),

	ERR_SUB_INVALID_DATA: createErrorSchema<{ message: string }>(
		'ERR_SUB_INVALID_DATA',
		'Invalid subscription data: {message}',
	),

	ERR_SUB_UPDATE_FAILED: createErrorSchema<{ userId: string }>(
		'ERR_SUB_UPDATE_FAILED',
		'Failed to update subscription for user "{userId}"',
	),
} as const;

/**
 * Event Bus Error Schemas
 */
export const eventErrorSchemas = {
	ERR_EVENT_OPERATION_FAILED: createErrorSchema<{ operation: string }>(
		'ERR_EVENT_OPERATION_FAILED',
		'Event operation failed: {operation}',
	),
} as const;

/**
 * Combined error schemas for unified access
 */
export const ALL_ERROR_SCHEMAS = {
	...genericErrorSchemas,
	...userErrorSchemas,
	...vendorErrorSchemas,
	...locationErrorSchemas,
	...communicationErrorSchemas,
	...infrastructureErrorSchemas,
	...websocketErrorSchemas,
	...searchErrorSchemas,
	...subscriptionErrorSchemas,
	...eventErrorSchemas,
} as const;

/**
 * Type representing all available error codes
 */
export type AvailableErrorCodes = keyof typeof ALL_ERROR_SCHEMAS;

/**
 * Automatically generate ErrorCodes with type-level documentation
 * This provides rich hover information through TypeScript's type system
 */
export const ErrorCodes = Object.keys(ALL_ERROR_SCHEMAS).reduce(
	(acc, key) => {
		acc[key] = key;
		return acc;
	},
	{} as Record<string, string>,
) as {
	// This mapped type automatically extracts rich information for each error code
	[K in AvailableErrorCodes]: K & {
		/** @internal Type-level documentation - hover to see error details */
		readonly __errorInfo: `Message: "${(typeof ALL_ERROR_SCHEMAS)[K]['_message']}" | Context: ${keyof ErrorContextMap[K] extends never ? 'none' : keyof ErrorContextMap[K] & string}`;
	};
};

/**
 * Type representing all possible error code enum values
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Type mapping from error code to context type
 * Now using pure TypeScript types for clean enforcement
 */
export type ErrorContextMap = {
	[K in keyof typeof ALL_ERROR_SCHEMAS]: (typeof ALL_ERROR_SCHEMAS)[K]['_context'];
};

/**
 * Helper to get error schema by code (minimal for core functionality)
 */
export function getErrorSchema<T extends AvailableErrorCodes>(code: T): (typeof ALL_ERROR_SCHEMAS)[T] {
	return ALL_ERROR_SCHEMAS[code];
}

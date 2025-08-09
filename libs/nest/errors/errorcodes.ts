/**
 * Error codes and their messages with support for placeholders.
 * This is the single source of truth for all error codes across all domains.
 *
 * Guidelines for using error codes:
 * 1. Use generic errors when the error is not specific to a domain
 * 2. Use domain-specific errors when the error is unique to a domain's business logic
 * 3. Always include relevant context variables in the error message
 * 4. Keep messages clear and actionable
 */
export const ErrorsMap = {
	// =============================================
	// Generic/Cross-cutting Errors (no domain prefix)
	// =============================================

	// Authentication/Authorization
	ERR_UNAUTHORIZED: 'Authentication required',
	ERR_INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
	ERR_INVALID_TOKEN: 'Invalid authentication token',
	ERR_TOKEN_EXPIRED: 'Authentication token has expired',

	// Input Validation
	ERR_INVALID_INPUT: 'Invalid input: {message}',
	ERR_MISSING_FIELD: 'Required field "{field}" is missing',
	ERR_INVALID_FORMAT: 'Invalid format for field "{field}"',
	ERR_INVALID_UUID: 'Invalid UUID format for "{uuid}"',
	ERR_INVALID_EMAIL: 'Invalid email format for "{email}"',
	ERR_INVALID_PHONE: 'Invalid phone number format for "{phone}"',
	ERR_INVALID_COORDINATES: 'Invalid coordinates: lat={lat}, long={long}',
	ERR_MISSING_REQUIRED_FIELD: 'Required field "{field}" is missing',

	// Database
	ERR_DB_CONNECTION: 'Database connection error',
	ERR_DB_OPERATION: 'Database operation "{operation}" failed',
	ERR_RESOURCE_NOT_FOUND: 'Resource of type "{type}" with ID "{id}" not found',
	ERR_RESOURCE_EXISTS: 'Resource of type "{type}" with ID "{id}" already exists',
	ERR_DUPLICATE_ENTRY: 'Duplicate entry for field "{field}" with value "{value}"',

	// External Services
	ERR_EXTERNAL_SERVICE: 'External service "{service}" error: {message}',
	ERR_SERVICE_UNAVAILABLE: 'Service "{service}" is currently unavailable',
	ERR_SERVICE_TIMEOUT: 'Service "{service}" request timed out',
	ERR_REDIS_OPERATION_FAILED: 'Redis operation "{operation}" failed: {errorType}',

	// Rate Limiting
	ERR_RATE_LIMIT: 'Rate limit exceeded. Try again in {seconds} seconds',
	ERR_TOO_MANY_REQUESTS: 'Too many requests. Try again in {seconds} seconds',

	// General
	ERR_INTERNAL: 'Internal server error',
	ERR_UNKNOWN: 'An unknown error occurred',

	// =============================================
	// Domain-Specific Errors (with domain prefix)
	// =============================================

	// User Domain (ERR_USER_*)
	ERR_USER_NOT_FOUND: 'User with ID "{userId}" not found',
	ERR_USER_EXISTS: 'User with email "{email}" already exists',
	ERR_USER_INVALID_DATA: 'Invalid user data: {message}',
	ERR_USER_INCOMPLETE: 'User profile is incomplete. Missing: {fields}',
	ERR_USER_VENDOR_EXISTS: 'User already has a relationship with vendor "{vendorId}"',

	// Vendor Domain (ERR_VENDOR_*)
	ERR_VENDOR_NOT_FOUND: 'Vendor with ID "{vendorId}" not found',
	ERR_VENDOR_EXISTS: 'Vendor with email "{email}" already exists',
	ERR_VENDOR_INVALID_DATA: 'Invalid vendor data: {message}',
	ERR_VENDOR_INCOMPLETE: 'Vendor profile is incomplete. Missing: {fields}',
	ERR_VENDOR_UNAUTHORIZED: 'User "{userId}" is not authorized to manage vendor "{vendorId}"',
	ERR_VENDOR_LIMIT: 'User "{userId}" has reached the maximum number of vendors allowed',

	// Location Domain (ERR_LOC_*)
	ERR_LOC_INVALID_COORDS: 'Invalid coordinates: lat={lat}, long={long}',
	ERR_LOC_NOT_FOUND: 'Location not found for vendor "{vendorId}"',
	ERR_LOC_UPDATE_FAILED: 'Failed to update location for vendor "{vendorId}"',
	ERR_LOC_QUERY_FAILED: 'Location query failed: {message}',
	ERR_LOC_REDIS_FAILED: 'Redis location operation failed: {operation}',

	// Communication Domain (ERR_COMM_*)
	ERR_COMM_WEBHOOK_INVALID: 'Invalid webhook payload from "{source}"',
	ERR_COMM_NOTIFICATION_FAILED: 'Failed to send notification to "{recipient}"',
	ERR_COMM_WEBHOOK_SIGNATURE: 'Invalid webhook signature from "{source}"',

	// Infrastructure Domain (ERR_INFRA_*)
	ERR_INFRA_FILE_NOT_FOUND: 'File "{filename}" not found',
	ERR_INFRA_UPLOAD_FAILED: 'Failed to upload file "{filename}": {message}',
	ERR_INFRA_ROUTING_FAILED: 'Failed to route request to "{service}"',
	ERR_INFRA_GATEWAY_ERROR: 'API Gateway error: {message}',

	// WebSocket Domain (ERR_WS_*)
	ERR_WS_AUTH_FAILED: 'WebSocket authentication failed for user "{userId}"',
	ERR_WS_CONNECTION_FAILED: 'WebSocket connection failed: {message}',
	ERR_WS_INVALID_MESSAGE: 'Invalid WebSocket message format: {message}',
	ERR_WS_RATE_LIMIT: 'WebSocket rate limit exceeded for user "{userId}"',

	// Search Domain (ERR_SEARCH_*)
	ERR_SEARCH_INDEX_INVALID: 'Invalid search index "{index}"',
	ERR_SEARCH_SYNC_FAILED: 'Failed to sync "{type}" with ID "{id}" to search index',
	ERR_SEARCH_QUERY_FAILED: 'Search query failed: {message}',

	// Subscription Domain (ERR_SUB_*)
	ERR_SUB_NOT_FOUND: 'Subscription not found for user "{userId}"',
	ERR_SUB_INVALID_DATA: 'Invalid subscription data: {message}',
	ERR_SUB_UPDATE_FAILED: 'Failed to update subscription for user "{userId}"',

	// Event Bus
	ERR_EVENT_OPERATION_FAILED: 'Event operation failed: {operation}',
} as const;

/**
 * Creates a map of error codes where each key maps to itself.
 * This allows us to use ErrorCodes.ERR_NAME instead of string literals.
 */
export const ErrorCodes = Object.keys(ErrorsMap).reduce((acc, key) => {
	acc[key] = key;
	return acc;
}, {}) as { [key in keyof typeof ErrorsMap]: key };

/**
 * Type representing all possible error codes
 */
export type ErrorCode = keyof typeof ErrorsMap;

/**
 * Interpolates variables into error messages
 * @param message The message template with {placeholder} syntax
 * @param variables Object containing values for the placeholders
 * @returns The interpolated message
 */
export function interpolateMessage(message: string, variables?: Record<string, any>): string {
	if (!variables) {
		return message;
	}

	return message.replace(/\{(\w+)\}/g, (match, key) => {
		return variables[key] !== undefined ? String(variables[key]) : match;
	});
}

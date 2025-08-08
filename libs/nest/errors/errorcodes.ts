// Error codes and their messages with support for placeholders
// This is the single source of truth for all error codes across all domains
export const ErrorsMap = {
	// Generic/Cross-cutting errors
	ERR_ALGOLIA_SERVICE: 'Search service error',
	ERR_ALGOLIA_SYNC: 'Failed to sync with search service',
	ERR_CLERK_SERVICE: 'Authentication service error',
	ERR_DB_CONNECTION: 'Database connection error',
	ERR_DB_OPERATION: 'Database operation "{operation}" failed',
	ERR_DUPLICATE_EMAIL: 'Email address "{email}" is already in use',
	ERR_EXTERNAL_SERVICE: 'External service "{service}" is unavailable',
	ERR_GRPC_DEADLINE: 'gRPC request deadline exceeded',
	ERR_GRPC_INVALID_ARG: 'Invalid gRPC argument',
	ERR_GRPC_SERVICE: 'gRPC service unavailable',
	ERR_INTERNAL: 'Internal server error',
	ERR_INVALID_DOMAIN_EVENT: 'Invalid domain event',
	ERR_INVALID_EMAIL: 'Invalid email format for "{email}"',
	ERR_INVALID_FILE_TYPE: 'Invalid file type',
	ERR_INVALID_FORMAT: 'Invalid format for field "{field}"',
	ERR_INVALID_INDEX: 'Invalid search index type',
	ERR_INVALID_INPUT: 'Invalid input: {message}',
	ERR_INVALID_PAYLOAD: 'Invalid webhook payload',
	ERR_INVALID_PHONE: 'Invalid phone number format for "{phone}"',
	ERR_INVALID_SEARCH_RECORD: 'Invalid search record',
	ERR_INVALID_SEARCH_UPDATE: 'Invalid search update',
	ERR_INVALID_SIGNATURE: 'Invalid webhook signature',
	ERR_INVALID_TOKEN: 'Invalid authentication token',
	ERR_INVALID_UUID: 'Invalid UUID format for "{uuid}"',
	ERR_MISSING_FIELD: 'Required field "{field}" is missing',
	ERR_RATE_LIMIT: 'Rate limit exceeded',
	ERR_REDIS_CONNECTION: 'Cache connection error',
	ERR_REDIS_OPERATION: 'Redis operation failed',
	ERR_RESOURCE_EXISTS: 'Resource already exists',
	ERR_RESOURCE_NOT_FOUND: 'Resource not found',
	ERR_TOKEN_EXPIRED: 'Authentication token has expired',
	ERR_TOO_MANY_REQUESTS: 'Too many requests',
	ERR_UNAUTHORIZED: 'Authentication required',
	ERR_UNKNOWN: 'An unknown error occurred',
	ERR_UPLOAD: 'File upload failed',

	// Communication domain errors
	ERR_COMM_WEBHOOK_SIGNATURE: 'Invalid webhook signature',
	ERR_COMM_NOTIFICATION: 'Notification delivery failed',
	ERR_COMM_WEBHOOK_PROCESSING: 'Webhook processing failed',

	// Infrastructure domain errors
	ERR_INFRA_FILE_NOT_FOUND: 'File not found',
	ERR_INFRA_FILE_UPLOAD: 'File upload failed',
	ERR_INFRA_GATEWAY_ROUTING: 'Gateway routing failed',
	ERR_INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',

	// Location domain errors
	ERR_LOC_GEOLOCATION: 'Geolocation operation failed',
	ERR_LOC_INVALID_COORDS: 'Invalid coordinates provided',
	ERR_LOC_INVALID_LAT: 'Invalid latitude value',
	ERR_LOC_INVALID_LONG: 'Invalid longitude value',
	ERR_LOC_NOT_FOUND: 'Location not found for vendor "{vendorId}"',
	ERR_LOC_PROXIMITY_SEARCH: 'Proximity search operation failed',
	ERR_LOC_QUERY: 'Location query failed',
	ERR_LOC_REDIS: 'Redis location operation failed',
	ERR_LOC_UPDATE: 'Location update failed',

	// Marketplace domain errors
	ERR_MKT_DB: 'Marketplace database operation failed',
	ERR_MKT_EVENT_SUBJECT: 'Invalid marketplace event subject',
	ERR_MKT_VENDOR_DATA: 'Invalid vendor data for marketplace',
	ERR_MKT_SEARCH_SYNC: 'Marketplace search synchronization failed',

	// NATS domain errors
	ERR_NATS_OPERATION: 'NATS operation failed',
	ERR_NATS_PUBLISH: 'Failed to publish NATS event',
	ERR_NATS_SUBSCRIBE: 'Failed to subscribe to NATS event',
	ERR_NATS_SUBSCRIPTION: 'Failed to initialize NATS subscriptions',

	// Subscription domain errors
	ERR_SUB_CREATE: 'Failed to create subscription',
	ERR_SUB_DELETE: 'Failed to delete subscription',
	ERR_SUB_NOT_FOUND: 'Subscription not found',
	ERR_SUB_UPDATE: 'Failed to update subscription',
	ERR_SUB_INVALID_DATA: 'Invalid subscription data',
	ERR_SUB_INVALID_OPTIONS: 'Invalid subscription options',

	// User domain errors
	ERR_USER_EXISTS: 'User already exists',
	ERR_USER_CREATE: 'Failed to create user',
	ERR_USER_DELETE: 'Failed to delete user',
	ERR_USER_INVALID_CREDS: 'Invalid user credentials',
	ERR_USER_INVALID_DATA: 'Invalid user data',
	ERR_USER_INVALID_LOCATION: 'Invalid user location data',
	ERR_USER_NOT_FOUND: 'User with ID "{userId}" not found',
	ERR_USER_OPERATION: 'User operation failed',
	ERR_USER_INCOMPLETE: 'User profile is incomplete',
	ERR_USER_UPDATE: 'Failed to update user',
	ERR_USER_VENDOR_EXISTS: 'User already has a relationship with this vendor',
	ERR_USER_VENDORS_FETCH: 'Failed to get user vendors',

	// Vendor domain errors
	ERR_VENDOR_EXISTS: 'Vendor already exists',
	ERR_VENDOR_CREATE: 'Failed to create vendor',
	ERR_VENDOR_DELETE: 'Failed to delete vendor',
	ERR_VENDOR_INVALID_LOCATION: 'Invalid vendor location data',
	ERR_VENDOR_LIMIT: 'Vendor limit exceeded',
	ERR_VENDOR_NOT_FOUND: 'Vendor with ID "{vendorId}" not found',
	ERR_VENDOR_OPERATION: 'Vendor operation failed',
	ERR_VENDOR_OWNER_NOT_FOUND: 'Vendor owner not found',
	ERR_VENDOR_INCOMPLETE: 'Vendor profile is incomplete',
	ERR_VENDOR_UNAUTHORIZED: 'Unauthorized vendor operation',
	ERR_VENDOR_UPDATE: 'Failed to update vendor',
	ERR_VENDOR_INVALID_ID: 'Invalid vendor ID',
	ERR_VENDOR_INVALID_DATA: 'Invalid vendor data',

	// WebSocket domain errors
	ERR_WS_AUTH: 'WebSocket authentication failed',
	ERR_WS_CONNECTION: 'WebSocket connection failed',
	ERR_WS_TIMEOUT: 'WebSocket connection timeout',
	ERR_WS_INVALID_FORMAT: 'Invalid WebSocket message format',
	ERR_WS_RATE_LIMIT: 'WebSocket rate limit exceeded',
} as const;

export const ErrorCodes = Object.keys(ErrorsMap).reduce((acc, key) => {
	acc[key] = key;
	return acc;
}, {}) as { [key in keyof typeof ErrorsMap]: key };

export type ErrorCode = keyof typeof ErrorsMap;

// Utility function to interpolate variables into error messages
export function interpolateMessage(message: string, variables?: Record<string, any>): string {
	if (!variables) {
		return message;
	}

	return message.replace(/\{(\w+)\}/g, (match, key) => {
		return variables[key] !== undefined ? String(variables[key]) : match;
	});
}

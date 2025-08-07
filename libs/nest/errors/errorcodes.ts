// Error codes and their messages with support for placeholders
// This is the single source of truth for all error codes across all domains
export const ErrorCodes = {
	// Generic/Cross-cutting errors
	ALGOLIA_SERVICE_ERROR: 'Search service error',
	CLERK_SERVICE_ERROR: 'Authentication service error',

	// Communication domain errors
	COMMUNICATION_INVALID_WEBHOOK_SIGNATURE: 'Invalid webhook signature',
	COMMUNICATION_NOTIFICATION_FAILED: 'Notification delivery failed',
	COMMUNICATION_WEBHOOK_PROCESSING_FAILED: 'Webhook processing failed',
	DATABASE_CONNECTION_ERROR: 'Database connection error',
	DATABASE_ERROR: 'Database operation "{operation}" failed',
	DUPLICATE_EMAIL: 'Email address "{email}" is already in use',
	EXTERNAL_SERVICE_UNAVAILABLE: 'External service "{service}" is unavailable',
	GRPC_DEADLINE_EXCEEDED: 'gRPC request deadline exceeded',
	GRPC_INVALID_ARGUMENT: 'Invalid gRPC argument',
	GRPC_SERVICE_UNAVAILABLE: 'gRPC service unavailable',

	// Infrastructure domain errors
	INFRASTRUCTURE_FILE_NOT_FOUND: 'File not found',
	INFRASTRUCTURE_FILE_UPLOAD_FAILED: 'File upload failed',
	INFRASTRUCTURE_GATEWAY_ROUTING_FAILED: 'Gateway routing failed',
	INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
	INTERNAL_SERVER_ERROR: 'Internal server error',
	INVALID_EMAIL: 'Invalid email format for "{email}"',
	INVALID_FORMAT: 'Invalid format for field "{field}"',
	INVALID_INPUT: 'Invalid input: {message}',
	INVALID_PHONE: 'Invalid phone number format for "{phone}"',
	INVALID_TOKEN: 'Invalid authentication token',
	INVALID_UUID: 'Invalid UUID format for "{uuid}"',
	LOCATION_GEOLOCATION_FAILED: 'Geolocation operation failed',
	LOCATION_INVALID_COORDINATES: 'Invalid coordinates provided',
	LOCATION_INVALID_LATITUDE: 'Invalid latitude value',
	LOCATION_INVALID_LONGITUDE: 'Invalid longitude value',

	// Location domain errors
	LOCATION_NOT_FOUND: 'Location not found for vendor "{vendorId}"',
	LOCATION_PROXIMITY_SEARCH_FAILED: 'Proximity search operation failed',
	LOCATION_REDIS_OPERATION_FAILED: 'Redis location operation failed',

	// Marketplace domain errors
	MARKETPLACE_DATABASE_ERROR: 'Marketplace database operation failed',
	MARKETPLACE_INVALID_EVENT_SUBJECT: 'Invalid marketplace event subject',
	MARKETPLACE_INVALID_VENDOR_DATA: 'Invalid vendor data for marketplace',
	MARKETPLACE_SEARCH_SYNC_FAILED: 'Marketplace search synchronization failed',
	MISSING_REQUIRED_FIELD: 'Required field "{field}" is missing',
	RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
	REDIS_CONNECTION_ERROR: 'Cache connection error',
	RESOURCE_ALREADY_EXISTS: 'Resource already exists',
	RESOURCE_NOT_FOUND: 'Resource not found',

	// Subscription domain errors
	SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
	TOKEN_EXPIRED: 'Authentication token has expired',
	TOO_MANY_REQUESTS: 'Too many requests',
	UNAUTHORIZED: 'Authentication required',
	UNKNOWN_ERROR: 'An unknown error occurred',

	// User domain errors
	USER_ALREADY_EXISTS: 'User already exists',
	USER_INVALID_CREDENTIALS: 'Invalid user credentials',
	USER_INVALID_LOCATION: 'Invalid user location data',
	USER_NOT_FOUND: 'User with ID "{userId}" not found',
	USER_PROFILE_INCOMPLETE: 'User profile is incomplete',
	USER_VENDOR_RELATIONSHIP_EXISTS: 'User already has a relationship with this vendor',
	VALIDATION_ERROR: 'Validation failed for {field}',

	// Vendor domain errors
	VENDOR_ALREADY_EXISTS: 'Vendor already exists',
	VENDOR_INVALID_LOCATION: 'Invalid vendor location data',
	VENDOR_NOT_FOUND: 'Vendor with ID "{vendorId}" not found',
	VENDOR_OWNER_NOT_FOUND: 'Vendor owner not found',
	VENDOR_PROFILE_INCOMPLETE: 'Vendor profile is incomplete',
	WS_AUTHENTICATION_FAILED: 'WebSocket authentication failed',
	WS_CONNECTION_FAILED: 'WebSocket connection failed',
	WS_CONNECTION_TIMEOUT: 'WebSocket connection timeout',
	WS_INVALID_MESSAGE_FORMAT: 'Invalid WebSocket message format',
	WS_RATE_LIMIT_EXCEEDED: 'WebSocket rate limit exceeded',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

// Utility function to interpolate variables into error messages
export function interpolateMessage(message: string, variables?: Record<string, any>): string {
	if (!variables) {
		return message;
	}

	return message.replace(/\{(\w+)\}/g, (match, key) => {
		return variables[key] !== undefined ? String(variables[key]) : match;
	});
}

// Error codes and their messages with support for placeholders
// This is the single source of truth for all error codes across all domains
export const ErrorCodes = {
	// Generic/Cross-cutting errors
	ALGOLIA_SERVICE_ERROR: 'Search service error',
	ALGOLIA_SYNC_FAILED: 'Failed to sync with search service',
	CLERK_SERVICE_ERROR: 'Authentication service error',
	DATABASE_CONNECTION_ERROR: 'Database connection error',
	DATABASE_ERROR: 'Database operation "{operation}" failed',
	DUPLICATE_EMAIL: 'Email address "{email}" is already in use',
	EXTERNAL_SERVICE_UNAVAILABLE: 'External service "{service}" is unavailable',
	GRPC_DEADLINE_EXCEEDED: 'gRPC request deadline exceeded',
	GRPC_INVALID_ARGUMENT: 'Invalid gRPC argument',
	GRPC_SERVICE_UNAVAILABLE: 'gRPC service unavailable',
	INTERNAL_SERVER_ERROR: 'Internal server error',
	INVALID_DOMAIN_EVENT: 'Invalid domain event',
	INVALID_EMAIL: 'Invalid email format for "{email}"',
	INVALID_FILE_TYPE: 'Invalid file type',
	INVALID_FORMAT: 'Invalid format for field "{field}"',
	INVALID_INDEX_TYPE: 'Invalid search index type',
	INVALID_INPUT: 'Invalid input: {message}',
	INVALID_PAYLOAD: 'Invalid webhook payload',
	INVALID_PHONE: 'Invalid phone number format for "{phone}"',
	INVALID_SEARCH_RECORD: 'Invalid search record',
	INVALID_SEARCH_UPDATE: 'Invalid search update',
	INVALID_SIGNATURE: 'Invalid webhook signature',
	INVALID_TOKEN: 'Invalid authentication token',
	INVALID_UUID: 'Invalid UUID format for "{uuid}"',
	MISSING_REQUIRED_FIELD: 'Required field "{field}" is missing',
	RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
	REDIS_CONNECTION_ERROR: 'Cache connection error',
	REDIS_OPERATION_FAILED: 'Redis operation failed',
	RESOURCE_ALREADY_EXISTS: 'Resource already exists',
	RESOURCE_NOT_FOUND: 'Resource not found',
	TOKEN_EXPIRED: 'Authentication token has expired',
	TOO_MANY_REQUESTS: 'Too many requests',
	UNAUTHORIZED: 'Authentication required',
	UNKNOWN_ERROR: 'An unknown error occurred',
	UPLOAD_FAILED: 'File upload failed',

	// Communication domain errors
	COMMUNICATION_INVALID_WEBHOOK_SIGNATURE: 'Invalid webhook signature',
	COMMUNICATION_NOTIFICATION_FAILED: 'Notification delivery failed',
	COMMUNICATION_WEBHOOK_PROCESSING_FAILED: 'Webhook processing failed',

	// Infrastructure domain errors
	INFRASTRUCTURE_FILE_NOT_FOUND: 'File not found',
	INFRASTRUCTURE_FILE_UPLOAD_FAILED: 'File upload failed',
	INFRASTRUCTURE_GATEWAY_ROUTING_FAILED: 'Gateway routing failed',
	INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',

	// Location domain errors
	LOCATION_GEOLOCATION_FAILED: 'Geolocation operation failed',
	LOCATION_INVALID_COORDINATES: 'Invalid coordinates provided',
	LOCATION_INVALID_LATITUDE: 'Invalid latitude value',
	LOCATION_INVALID_LONGITUDE: 'Invalid longitude value',
	LOCATION_NOT_FOUND: 'Location not found for vendor "{vendorId}"',
	LOCATION_PROXIMITY_SEARCH_FAILED: 'Proximity search operation failed',
	LOCATION_QUERY_FAILED: 'Location query failed',
	LOCATION_REDIS_OPERATION_FAILED: 'Redis location operation failed',
	LOCATION_UPDATE_FAILED: 'Location update failed',

	// Marketplace domain errors
	MARKETPLACE_DATABASE_ERROR: 'Marketplace database operation failed',
	MARKETPLACE_INVALID_EVENT_SUBJECT: 'Invalid marketplace event subject',
	MARKETPLACE_INVALID_VENDOR_DATA: 'Invalid vendor data for marketplace',
	MARKETPLACE_SEARCH_SYNC_FAILED: 'Marketplace search synchronization failed',

	// NATS domain errors
	NATS_OPERATION_FAILED: 'NATS operation failed',
	NATS_PUBLISH_FAILED: 'Failed to publish NATS event',
	NATS_SUBSCRIBE_FAILED: 'Failed to subscribe to NATS event',
	NATS_SUBSCRIPTION_FAILED: 'Failed to initialize NATS subscriptions',

	// Subscription domain errors
	SUBSCRIPTION_CREATION_FAILED: 'Failed to create subscription',
	SUBSCRIPTION_DELETION_FAILED: 'Failed to delete subscription',
	SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
	SUBSCRIPTION_UPDATE_FAILED: 'Failed to update subscription',
	INVALID_SUBSCRIPTION_DATA: 'Invalid subscription data',
	INVALID_SUBSCRIPTION_OPTIONS: 'Invalid subscription options',

	// User domain errors
	USER_ALREADY_EXISTS: 'User already exists',
	USER_CREATION_FAILED: 'Failed to create user',
	USER_DELETION_FAILED: 'Failed to delete user',
	USER_INVALID_CREDENTIALS: 'Invalid user credentials',
	USER_INVALID_DATA: 'Invalid user data',
	USER_INVALID_LOCATION: 'Invalid user location data',
	USER_NOT_FOUND: 'User with ID "{userId}" not found',
	USER_OPERATION_FAILED: 'User operation failed',
	USER_PROFILE_INCOMPLETE: 'User profile is incomplete',
	USER_UPDATE_FAILED: 'Failed to update user',
	USER_VENDOR_RELATIONSHIP_EXISTS: 'User already has a relationship with this vendor',
	USER_VENDORS_RETRIEVAL_FAILED: 'Failed to get user vendors',

	// Vendor domain errors
	VENDOR_ALREADY_EXISTS: 'Vendor already exists',
	VENDOR_CREATION_FAILED: 'Failed to create vendor',
	VENDOR_DELETION_FAILED: 'Failed to delete vendor',
	VENDOR_INVALID_LOCATION: 'Invalid vendor location data',
	VENDOR_LIMIT_EXCEEDED: 'Vendor limit exceeded',
	VENDOR_NOT_FOUND: 'Vendor with ID "{vendorId}" not found',
	VENDOR_OPERATION_FAILED: 'Vendor operation failed',
	VENDOR_OWNER_NOT_FOUND: 'Vendor owner not found',
	VENDOR_PROFILE_INCOMPLETE: 'Vendor profile is incomplete',
	VENDOR_UNAUTHORIZED: 'Unauthorized vendor operation',
	VENDOR_UPDATE_FAILED: 'Failed to update vendor',
	INVALID_VENDOR_ID: 'Invalid vendor ID',
	INVALID_VENDOR_DATA: 'Invalid vendor data',
	INVALID_LOCATION_DATA: 'Invalid location data',

	// WebSocket domain errors
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

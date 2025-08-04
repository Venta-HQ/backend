// Error codes and their messages with support for placeholders
export const ErrorCodes = {
	ALGOLIA_SERVICE_ERROR: 'Search service error',
	CLERK_SERVICE_ERROR: 'Authentication service error',
	DATABASE_CONNECTION_ERROR: 'Database connection error',
	DATABASE_ERROR: 'Database operation "{operation}" failed',
	DUPLICATE_EMAIL: 'Email address "{email}" is already in use',
	EXTERNAL_SERVICE_UNAVAILABLE: 'External service "{service}" is unavailable',
	GRPC_DEADLINE_EXCEEDED: 'gRPC request deadline exceeded',
	GRPC_INVALID_ARGUMENT: 'Invalid gRPC argument',
	GRPC_SERVICE_UNAVAILABLE: 'gRPC service unavailable',
	INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
	INTERNAL_SERVER_ERROR: 'Internal server error',
	INVALID_EMAIL: 'Invalid email format for "{email}"',
	INVALID_FORMAT: 'Invalid format for field "{field}"',
	INVALID_INPUT: 'Invalid input: {message}',
	INVALID_PHONE: 'Invalid phone number format for "{phone}"',
	INVALID_TOKEN: 'Invalid authentication token',
	INVALID_UUID: 'Invalid UUID format for "{uuid}"',
	LOCATION_NOT_FOUND: 'Location not found for vendor "{vendorId}"',
	MISSING_REQUIRED_FIELD: 'Required field "{field}" is missing',
	RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
	REDIS_CONNECTION_ERROR: 'Cache connection error',
	RESOURCE_ALREADY_EXISTS: 'Resource already exists',
	RESOURCE_NOT_FOUND: 'Resource not found',
	SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
	TOKEN_EXPIRED: 'Authentication token has expired',
	TOO_MANY_REQUESTS: 'Too many requests',
	UNAUTHORIZED: 'Authentication required',
	UNKNOWN_ERROR: 'An unknown error occurred',
	USER_ALREADY_EXISTS: 'User already exists',
	USER_NOT_FOUND: 'User with ID "{userId}" not found',
	VALIDATION_ERROR: 'Validation failed for {field}',
	VENDOR_ALREADY_EXISTS: 'Vendor already exists',
	VENDOR_NOT_FOUND: 'Vendor with ID "{vendorId}" not found',
	WS_AUTHENTICATION_FAILED: 'WebSocket authentication failed',
	WS_CONNECTION_FAILED: 'WebSocket connection failed',
	WS_INVALID_MESSAGE_FORMAT: 'Invalid WebSocket message format',
	WS_RATE_LIMIT_EXCEEDED: 'WebSocket rate limit exceeded',
	WS_CONNECTION_TIMEOUT: 'WebSocket connection timeout',
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

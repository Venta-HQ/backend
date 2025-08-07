import { AppError, ErrorType } from './app-error';

/**
 * Base domain error class that extends AppError with domain context
 */
export class DomainError extends AppError {
	constructor(
		code: string,
		message: string,
		context?: Record<string, any>,
		public readonly domain?: string,
	) {
		super(ErrorType.INTERNAL, code, message, context);
	}
}

/**
 * Location domain-specific error class
 */
export class LocationDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'location-services');
	}
}

/**
 * User domain-specific error class
 */
export class UserDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'user-management');
	}
}

/**
 * Vendor domain-specific error class
 */
export class VendorDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'vendor-management');
	}
}

/**
 * Marketplace domain-specific error class
 */
export class MarketplaceDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'marketplace');
	}
}

/**
 * Communication domain-specific error class
 */
export class CommunicationDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'communication');
	}
}

/**
 * Infrastructure domain-specific error class
 */
export class InfrastructureDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'infrastructure');
	}
}

// Domain error codes for location services
export const LocationDomainErrorCodes = {
	INVALID_LATITUDE: 'LOCATION_INVALID_LATITUDE',
	INVALID_LONGITUDE: 'LOCATION_INVALID_LONGITUDE',
	INVALID_COORDINATES: 'LOCATION_INVALID_COORDINATES',
	LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
	GEOLOCATION_FAILED: 'LOCATION_GEOLOCATION_FAILED',
	PROXIMITY_SEARCH_FAILED: 'LOCATION_PROXIMITY_SEARCH_FAILED',
	REDIS_OPERATION_FAILED: 'LOCATION_REDIS_OPERATION_FAILED',
} as const;

// Domain error codes for user management
export const UserDomainErrorCodes = {
	ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
	INVALID_CREDENTIALS: 'USER_INVALID_CREDENTIALS',
	PROFILE_INCOMPLETE: 'USER_PROFILE_INCOMPLETE',
	SUBSCRIPTION_NOT_FOUND: 'USER_SUBSCRIPTION_NOT_FOUND',
	VENDOR_RELATIONSHIP_EXISTS: 'USER_VENDOR_RELATIONSHIP_EXISTS',
} as const;

// Domain error codes for vendor management
export const VendorDomainErrorCodes = {
	ALREADY_EXISTS: 'VENDOR_ALREADY_EXISTS',
	INVALID_LOCATION: 'VENDOR_INVALID_LOCATION',
	INSUFFICIENT_PERMISSIONS: 'VENDOR_INSUFFICIENT_PERMISSIONS',
	OWNER_NOT_FOUND: 'VENDOR_OWNER_NOT_FOUND',
	PROFILE_INCOMPLETE: 'VENDOR_PROFILE_INCOMPLETE',
} as const;

// Domain error codes for marketplace
export const MarketplaceDomainErrorCodes = {
	SEARCH_FAILED: 'MARKETPLACE_SEARCH_FAILED',
	DISCOVERY_FAILED: 'MARKETPLACE_DISCOVERY_FAILED',
	ALGOLIA_SYNC_FAILED: 'MARKETPLACE_ALGOLIA_SYNC_FAILED',
} as const;

// Domain error codes for communication
export const CommunicationDomainErrorCodes = {
	WEBHOOK_PROCESSING_FAILED: 'COMMUNICATION_WEBHOOK_PROCESSING_FAILED',
	INVALID_WEBHOOK_SIGNATURE: 'COMMUNICATION_INVALID_WEBHOOK_SIGNATURE',
	NOTIFICATION_FAILED: 'COMMUNICATION_NOTIFICATION_FAILED',
} as const;

// Domain error codes for infrastructure
export const InfrastructureDomainErrorCodes = {
	FILE_UPLOAD_FAILED: 'INFRASTRUCTURE_FILE_UPLOAD_FAILED',
	FILE_NOT_FOUND: 'INFRASTRUCTURE_FILE_NOT_FOUND',
	GATEWAY_ROUTING_FAILED: 'INFRASTRUCTURE_GATEWAY_ROUTING_FAILED',
} as const; 
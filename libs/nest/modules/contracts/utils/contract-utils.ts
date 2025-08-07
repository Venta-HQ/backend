import { Logger } from '@nestjs/common';

/**
 * Contract Utilities
 *
 * Shared utilities for domain-specific contract operations.
 * These utilities can be used by any contract implementation.
 */
export class ContractUtils {
	private static logger = new Logger('ContractUtils');

	// ============================================================================
	// Location Validation & Transformation
	// ============================================================================

	/**
	 * Validate location data
	 */
	static validateLocation(location: { lat: number; lng: number }): boolean {
		const isValid =
			typeof location.lat === 'number' &&
			location.lat >= -90 &&
			location.lat <= 90 &&
			typeof location.lng === 'number' &&
			location.lng >= -180 &&
			location.lng <= 180;

		if (!isValid) {
			this.logger.warn('Invalid location data', { location });
		}

		return isValid;
	}

	/**
	 * Validate bounds data
	 */
	static validateBounds(bounds: {
		northEast: { lat: number; lng: number };
		southWest: { lat: number; lng: number };
	}): boolean {
		const isValid =
			this.validateLocation(bounds.northEast) &&
			this.validateLocation(bounds.southWest) &&
			bounds.northEast.lat > bounds.southWest.lat &&
			bounds.northEast.lng > bounds.southWest.lng;

		if (!isValid) {
			this.logger.warn('Invalid bounds data', { bounds });
		}

		return isValid;
	}

	/**
	 * Transform location format (lat/lng to latitude/longitude)
	 */
	static transformLocationToLatLng(location: { lat: number; lng: number }) {
		return {
			latitude: location.lat,
			longitude: location.lng,
		};
	}

	/**
	 * Transform location format (latitude/longitude to lat/lng)
	 */
	static transformLatLngToLocation(location: { latitude: number; longitude: number }) {
		return {
			lat: location.latitude,
			lng: location.longitude,
		};
	}

	/**
	 * Transform bounds format
	 */
	static transformBounds(bounds: { northEast: { lat: number; lng: number }; southWest: { lat: number; lng: number } }) {
		return {
			northEast: this.transformLocationToLatLng(bounds.northEast),
			southWest: this.transformLocationToLatLng(bounds.southWest),
		};
	}

	// ============================================================================
	// User Data Validation & Transformation
	// ============================================================================

	/**
	 * Validate user data
	 */
	static validateUserData(userData: {
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			userData &&
			typeof userData.email === 'string' &&
			userData.email.includes('@') &&
			(!userData.firstName || typeof userData.firstName === 'string') &&
			(!userData.lastName || typeof userData.lastName === 'string') &&
			(!userData.metadata || typeof userData.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid user data', { userData });
		}

		return isValid;
	}

	/**
	 * Extract email from external service data
	 */
	static extractEmail(data: any): string {
		// Handle different API versions and structures
		if (data.emailAddresses && data.emailAddresses.length > 0) {
			return data.emailAddresses[0].emailAddress;
		}

		if (data.email_addresses && data.email_addresses.length > 0) {
			return data.email_addresses[0].email_address;
		}

		if (data.primaryEmailAddress) {
			return data.primaryEmailAddress.emailAddress;
		}

		if (data.primary_email_address) {
			return data.primary_email_address.email_address;
		}

		if (data.email) {
			return data.email;
		}

		throw new Error('Could not extract email from external service data');
	}

	/**
	 * Extract first name from external service data
	 */
	static extractFirstName(data: any): string {
		return data.firstName || data.first_name || '';
	}

	/**
	 * Extract last name from external service data
	 */
	static extractLastName(data: any): string {
		return data.lastName || data.last_name || '';
	}

	/**
	 * Extract metadata from external service data
	 */
	static extractMetadata(data: any): Record<string, any> {
		return data.publicMetadata || data.public_metadata || data.metadata || {};
	}

	// ============================================================================
	// Subscription Data Validation & Transformation
	// ============================================================================

	/**
	 * Validate subscription data
	 */
	static validateSubscriptionData(subscriptionData: {
		productId: string;
		status: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			subscriptionData &&
			typeof subscriptionData.productId === 'string' &&
			subscriptionData.productId.length > 0 &&
			typeof subscriptionData.status === 'string' &&
			subscriptionData.status.length > 0 &&
			(!subscriptionData.metadata || typeof subscriptionData.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid subscription data', { subscriptionData });
		}

		return isValid;
	}

	/**
	 * Extract user ID from external service data
	 */
	static extractUserId(data: any): string {
		return data.app_user_id || data.user_id || data.id || '';
	}

	/**
	 * Extract product ID from external service data
	 */
	static extractProductId(data: any): string {
		return data.product_id || data.productId || '';
	}

	/**
	 * Extract status from external service data
	 */
	static extractStatus(data: any): string {
		return data.status || data.subscription_status || 'unknown';
	}

	/**
	 * Extract transaction ID from external service data
	 */
	static extractTransactionId(data: any): string {
		return data.transaction_id || data.transactionId || '';
	}

	/**
	 * Extract original transaction ID from external service data
	 */
	static extractOriginalTransactionId(data: any): string {
		return data.original_transaction_id || data.originalTransactionId || '';
	}

	// ============================================================================
	// File Data Validation
	// ============================================================================

	/**
	 * Validate file data
	 */
	static validateFileData(file: {
		filename: string;
		buffer: Buffer;
		mimeType: string;
		uploadedBy: string;
		context: string;
	}): boolean {
		const isValid =
			file &&
			typeof file.filename === 'string' &&
			file.filename.length > 0 &&
			Buffer.isBuffer(file.buffer) &&
			file.buffer.length > 0 &&
			typeof file.mimeType === 'string' &&
			file.mimeType.length > 0 &&
			typeof file.uploadedBy === 'string' &&
			file.uploadedBy.length > 0 &&
			typeof file.context === 'string' &&
			file.context.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid file data', { file });
		}

		return isValid;
	}

	// ============================================================================
	// Data Sanitization
	// ============================================================================

	/**
	 * Sanitize metadata for external APIs
	 */
	static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
		const sanitized: Record<string, any> = {};

		for (const [key, value] of Object.entries(metadata)) {
			if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
				sanitized[key] = value;
			} else if (value === null || value === undefined) {
				continue;
			} else {
				sanitized[key] = JSON.stringify(value);
			}
		}

		return sanitized;
	}

	/**
	 * Sanitize attributes for external APIs
	 */
	static sanitizeAttributes(attributes: Record<string, any>): Record<string, any> {
		const sanitized: Record<string, any> = {};

		for (const [key, value] of Object.entries(attributes)) {
			if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
				sanitized[key] = value;
			} else if (value === null || value === undefined) {
				continue;
			} else {
				sanitized[key] = JSON.stringify(value);
			}
		}

		return sanitized;
	}

	// ============================================================================
	// Timestamp Utilities
	// ============================================================================

	/**
	 * Extract created at timestamp from external service data
	 */
	static extractCreatedAt(data: any): string {
		return data.createdAt || data.created_at || new Date().toISOString();
	}

	/**
	 * Extract updated at timestamp from external service data
	 */
	static extractUpdatedAt(data: any): string {
		return data.updatedAt || data.updated_at || new Date().toISOString();
	}
}

import { Logger } from '@nestjs/common';

/**
 * Shared Validation Utilities
 * 
 * Truly shared validation logic that can be used across all domains.
 * These utilities are domain-agnostic and don't create cross-domain dependencies.
 */
export class ValidationUtils {
	private static logger = new Logger('ValidationUtils');

	// ============================================================================
	// Generic Data Validation
	// ============================================================================

	/**
	 * Validate that a value is a non-empty string
	 */
	static isValidString(value: any): boolean {
		return typeof value === 'string' && value.length > 0;
	}

	/**
	 * Validate that a value is a valid email
	 */
	static isValidEmail(email: any): boolean {
		return this.isValidString(email) && email.includes('@');
	}

	/**
	 * Validate that a value is a positive number
	 */
	static isValidPositiveNumber(value: any): boolean {
		return typeof value === 'number' && value > 0;
	}

	/**
	 * Validate that a value is a valid object (not null, not array)
	 */
	static isValidObject(value: any): boolean {
		return value && typeof value === 'object' && !Array.isArray(value);
	}

	/**
	 * Validate that a value is a valid array
	 */
	static isValidArray(value: any): boolean {
		return Array.isArray(value) && value.length > 0;
	}

	/**
	 * Validate that a value is a valid Buffer
	 */
	static isValidBuffer(value: any): boolean {
		return Buffer.isBuffer(value) && value.length > 0;
	}

	// ============================================================================
	// Location Validation (Truly Shared)
	// ============================================================================

	/**
	 * Validate location coordinates (latitude/longitude)
	 */
	static isValidLocation(location: { lat: number; lng: number }): boolean {
		const isValid =
			typeof location.lat === 'number' &&
			location.lat >= -90 &&
			location.lat <= 90 &&
			typeof location.lng === 'number' &&
			location.lng >= -180 &&
			location.lng <= 180;

		if (!isValid) {
			this.logger.warn('Invalid location coordinates', { location });
		}

		return isValid;
	}

	/**
	 * Validate location bounds
	 */
	static isValidBounds(bounds: {
		northEast: { lat: number; lng: number };
		southWest: { lat: number; lng: number };
	}): boolean {
		const isValid =
			this.isValidLocation(bounds.northEast) &&
			this.isValidLocation(bounds.southWest) &&
			bounds.northEast.lat > bounds.southWest.lat &&
			bounds.northEast.lng > bounds.southWest.lng;

		if (!isValid) {
			this.logger.warn('Invalid location bounds', { bounds });
		}

		return isValid;
	}

	// ============================================================================
	// Data Sanitization (Truly Shared)
	// ============================================================================

	/**
	 * Sanitize object for external APIs (convert complex types to strings)
	 */
	static sanitizeObject(obj: Record<string, any>): Record<string, any> {
		const sanitized: Record<string, any> = {};

		for (const [key, value] of Object.entries(obj)) {
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
	// Timestamp Utilities (Truly Shared)
	// ============================================================================

	/**
	 * Extract timestamp from various formats
	 */
	static extractTimestamp(data: any, fallback?: string): string {
		return data.createdAt || data.created_at || data.updatedAt || data.updated_at || fallback || new Date().toISOString();
	}

	/**
	 * Validate timestamp format
	 */
	static isValidTimestamp(timestamp: any): boolean {
		if (!this.isValidString(timestamp)) return false;
		const date = new Date(timestamp);
		return !isNaN(date.getTime());
	}
} 
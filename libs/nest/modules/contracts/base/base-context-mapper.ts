import { Logger } from '@nestjs/common';
import { AppError, ErrorType, ErrorCodes } from '@app/nest/errors';

/**
 * Base Context Mapper
 * 
 * Provides common functionality for context mappers across all domains.
 * Extend this class to create domain-specific context mappers.
 */
export abstract class BaseContextMapper {
	protected readonly logger: Logger;

	constructor(loggerName: string) {
		this.logger = new Logger(loggerName);
	}

	// ============================================================================
	// Common Validation Methods
	// ============================================================================

	/**
	 * Validate location data
	 */
	protected validateLocation(location: { lat: number; lng: number }): boolean {
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
	protected validateBounds(bounds: {
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
	 * Validate user data
	 */
	protected validateUserData(userData: {
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
	 * Validate subscription data
	 */
	protected validateSubscriptionData(subscriptionData: {
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
	 * Validate file data
	 */
	protected validateFileData(file: {
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

	/**
	 * Validate external service type
	 */
	protected validateExternalService(service: string): service is 'clerk' | 'revenuecat' {
		const isValid = ['clerk', 'revenuecat'].includes(service);

		if (!isValid) {
			this.logger.warn('Invalid external service type', { service });
		}

		return isValid;
	}

	// ============================================================================
	// Common Data Transformation Methods
	// ============================================================================

	/**
	 * Transform location format (lat/lng to latitude/longitude)
	 */
	protected transformLocationToLatLng(location: { lat: number; lng: number }) {
		return {
			latitude: location.lat,
			longitude: location.lng,
		};
	}

	/**
	 * Transform location format (latitude/longitude to lat/lng)
	 */
	protected transformLatLngToLocation(location: { latitude: number; longitude: number }) {
		return {
			lat: location.latitude,
			lng: location.longitude,
		};
	}

	/**
	 * Transform bounds format
	 */
	protected transformBounds(bounds: {
		northEast: { lat: number; lng: number };
		southWest: { lat: number; lng: number };
	}) {
		return {
			northEast: this.transformLocationToLatLng(bounds.northEast),
			southWest: this.transformLocationToLatLng(bounds.southWest),
		};
	}

	/**
	 * Sanitize metadata for external APIs
	 */
	protected sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
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

	// ============================================================================
	// Common Error Handling Methods
	// ============================================================================

	/**
	 * Create validation error
	 */
	protected createValidationError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.VALIDATION_ERROR, message, details);
	}

	/**
	 * Create translation error
	 */
	protected createTranslationError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_FORMAT, message, details);
	}

	// ============================================================================
	// Common Logging Methods
	// ============================================================================

	/**
	 * Log translation start
	 */
	protected logTranslationStart(operation: string, data: any) {
		this.logger.debug(`Starting translation: ${operation}`, {
			operation,
			dataType: typeof data,
			hasData: !!data,
		});
	}

	/**
	 * Log translation success
	 */
	protected logTranslationSuccess(operation: string, result: any) {
		this.logger.debug(`Translation successful: ${operation}`, {
			operation,
			resultType: typeof result,
			hasResult: !!result,
		});
	}

	/**
	 * Log translation error
	 */
	protected logTranslationError(operation: string, error: any, data?: any) {
		this.logger.error(`Translation failed: ${operation}`, error.stack, {
			operation,
			error: error.message,
			data,
		});
	}

	// ============================================================================
	// Abstract Methods (must be implemented by subclasses)
	// ============================================================================

	/**
	 * Get the domain name for this mapper
	 */
	abstract getDomain(): string;

	/**
	 * Get the target domain name for this mapper
	 */
	abstract getTargetDomain(): string;

	/**
	 * Validate source data before translation
	 */
	abstract validateSourceData(data: any): boolean;

	/**
	 * Validate target data after translation
	 */
	abstract validateTargetData(data: any): boolean;
} 
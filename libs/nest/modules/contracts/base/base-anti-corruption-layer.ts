import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { Logger } from '@nestjs/common';

/**
 * Base Anti-Corruption Layer
 *
 * Provides common functionality for anti-corruption layers across all domains.
 * Extend this class to create domain-specific anti-corruption layers.
 */
export abstract class BaseAntiCorruptionLayer {
	protected readonly logger: Logger;

	constructor(loggerName: string) {
		this.logger = new Logger(loggerName);
	}

	// ============================================================================
	// Common Data Extraction Methods
	// ============================================================================

	/**
	 * Extract email from external service data
	 */
	protected extractEmail(data: any): string {
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

		throw this.createExtractionError('Could not extract email from external service data', { data });
	}

	/**
	 * Extract first name from external service data
	 */
	protected extractFirstName(data: any): string {
		return data.firstName || data.first_name || '';
	}

	/**
	 * Extract last name from external service data
	 */
	protected extractLastName(data: any): string {
		return data.lastName || data.last_name || '';
	}

	/**
	 * Extract metadata from external service data
	 */
	protected extractMetadata(data: any): Record<string, any> {
		return data.publicMetadata || data.public_metadata || data.metadata || {};
	}

	/**
	 * Extract created at timestamp from external service data
	 */
	protected extractCreatedAt(data: any): string {
		return data.createdAt || data.created_at || new Date().toISOString();
	}

	/**
	 * Extract updated at timestamp from external service data
	 */
	protected extractUpdatedAt(data: any): string {
		return data.updatedAt || data.updated_at || new Date().toISOString();
	}

	/**
	 * Extract user ID from external service data
	 */
	protected extractUserId(data: any): string {
		return data.app_user_id || data.user_id || data.id || '';
	}

	/**
	 * Extract product ID from external service data
	 */
	protected extractProductId(data: any): string {
		return data.product_id || data.productId || '';
	}

	/**
	 * Extract status from external service data
	 */
	protected extractStatus(data: any): string {
		return data.status || data.subscription_status || 'unknown';
	}

	/**
	 * Extract transaction ID from external service data
	 */
	protected extractTransactionId(data: any): string {
		return data.transaction_id || data.transactionId || '';
	}

	/**
	 * Extract original transaction ID from external service data
	 */
	protected extractOriginalTransactionId(data: any): string {
		return data.original_transaction_id || data.originalTransactionId || '';
	}

	// ============================================================================
	// Common Validation Methods
	// ============================================================================

	/**
	 * Validate external user data
	 */
	protected validateExternalUser(data: any): boolean {
		const isValid = data && typeof data.id === 'string' && data.id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid external user data', { data });
		}

		return isValid;
	}

	/**
	 * Validate external user ID
	 */
	protected validateExternalUserId(userId: string): boolean {
		const isValid = typeof userId === 'string' && userId.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid external user ID', { userId });
		}

		return isValid;
	}

	/**
	 * Validate external subscription data
	 */
	protected validateExternalSubscription(data: any): boolean {
		const isValid =
			data &&
			typeof data.app_user_id === 'string' &&
			data.app_user_id.length > 0 &&
			typeof data.product_id === 'string' &&
			data.product_id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid external subscription data', { data });
		}

		return isValid;
	}

	/**
	 * Validate external event data
	 */
	protected validateExternalEvent(data: any): boolean {
		const isValid =
			data &&
			typeof data.event_type === 'string' &&
			data.event_type.length > 0 &&
			typeof data.app_user_id === 'string' &&
			data.app_user_id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid external event data', { data });
		}

		return isValid;
	}

	/**
	 * Validate marketplace user data
	 */
	protected validateMarketplaceUser(marketplaceUser: {
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			marketplaceUser &&
			typeof marketplaceUser.email === 'string' &&
			marketplaceUser.email.includes('@') &&
			(!marketplaceUser.firstName || typeof marketplaceUser.firstName === 'string') &&
			(!marketplaceUser.lastName || typeof marketplaceUser.lastName === 'string') &&
			(!marketplaceUser.metadata || typeof marketplaceUser.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid marketplace user data', { marketplaceUser });
		}

		return isValid;
	}

	/**
	 * Validate marketplace user update data
	 */
	protected validateMarketplaceUserUpdate(updates: {
		email?: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			updates &&
			typeof updates === 'object' &&
			(!updates.email || (typeof updates.email === 'string' && updates.email.includes('@'))) &&
			(!updates.firstName || typeof updates.firstName === 'string') &&
			(!updates.lastName || typeof updates.lastName === 'string') &&
			(!updates.metadata || typeof updates.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid marketplace user update data', { updates });
		}

		return isValid;
	}

	/**
	 * Validate marketplace attributes data
	 */
	protected validateMarketplaceAttributes(attributes: Record<string, any>): boolean {
		const isValid = attributes && typeof attributes === 'object' && !Array.isArray(attributes);

		if (!isValid) {
			this.logger.warn('Invalid marketplace attributes data', { attributes });
		}

		return isValid;
	}

	// ============================================================================
	// Common Data Transformation Methods
	// ============================================================================

	/**
	 * Transform marketplace user to external format
	 */
	protected transformToExternalUser(marketplaceUser: {
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}) {
		return {
			emailAddress: [marketplaceUser.email],
			firstName: marketplaceUser.firstName || '',
			lastName: marketplaceUser.lastName || '',
			publicMetadata: marketplaceUser.metadata || {},
		};
	}

	/**
	 * Transform marketplace user update to external format
	 */
	protected transformToExternalUserUpdate(updates: {
		email?: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}) {
		const externalUpdate: Record<string, any> = {};

		if (updates.email) {
			externalUpdate.emailAddress = [updates.email];
		}

		if (updates.firstName !== undefined) {
			externalUpdate.firstName = updates.firstName;
		}

		if (updates.lastName !== undefined) {
			externalUpdate.lastName = updates.lastName;
		}

		if (updates.metadata) {
			externalUpdate.publicMetadata = updates.metadata;
		}

		return externalUpdate;
	}

	/**
	 * Sanitize attributes for external APIs
	 */
	protected sanitizeAttributes(attributes: Record<string, any>): Record<string, any> {
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
	// Common Error Handling Methods
	// ============================================================================

	/**
	 * Create validation error
	 */
	protected createValidationError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.VALIDATION_ERROR, message, details);
	}

	/**
	 * Create extraction error
	 */
	protected createExtractionError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_FORMAT, message, details);
	}

	/**
	 * Create transformation error
	 */
	protected createTransformationError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_FORMAT, message, details);
	}

	// ============================================================================
	// Common Logging Methods
	// ============================================================================

	/**
	 * Log translation start
	 */
	protected logTranslationStart(operation: string, data: any) {
		this.logger.debug(`Starting anti-corruption translation: ${operation}`, {
			operation,
			dataType: typeof data,
			hasData: !!data,
		});
	}

	/**
	 * Log translation success
	 */
	protected logTranslationSuccess(operation: string, result: any) {
		this.logger.debug(`Anti-corruption translation successful: ${operation}`, {
			operation,
			resultType: typeof result,
			hasResult: !!result,
		});
	}

	/**
	 * Log translation error
	 */
	protected logTranslationError(operation: string, error: any, data?: any) {
		this.logger.error(`Anti-corruption translation failed: ${operation}`, error.stack, {
			operation,
			error: error.message,
			data,
		});
	}

	// ============================================================================
	// Abstract Methods (must be implemented by subclasses)
	// ============================================================================

	/**
	 * Get the external service name
	 */
	abstract getExternalService(): string;

	/**
	 * Get the domain name for this anti-corruption layer
	 */
	abstract getDomain(): string;

	/**
	 * Validate external service data
	 */
	abstract validateExternalData(data: any): boolean;

	/**
	 * Validate marketplace data
	 */
	abstract validateMarketplaceData(data: any): boolean;
}

import { TransformationUtils, ValidationUtils } from '@app/utils';
import { Logger } from '@nestjs/common';

/**
 * Marketplace Contract Utilities
 *
 * Domain-specific utilities for marketplace contract operations.
 * Contains validation and transformation logic specific to the marketplace domain.
 */
export class MarketplaceContractUtils {
	private static logger = new Logger('MarketplaceContractUtils');

	// ============================================================================
	// Marketplace-Specific User Data Validation
	// ============================================================================

	/**
	 * Validate marketplace user data
	 */
	static validateUserData(userData: {
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			userData &&
			ValidationUtils.isValidEmail(userData.email) &&
			(!userData.firstName || ValidationUtils.isValidString(userData.firstName)) &&
			(!userData.lastName || ValidationUtils.isValidString(userData.lastName)) &&
			(!userData.metadata || ValidationUtils.isValidObject(userData.metadata));

		if (!isValid) {
			this.logger.warn('Invalid marketplace user data', { userData });
		}

		return isValid;
	}

	/**
	 * Extract email from external service data for marketplace
	 */
	static extractEmail(data: any): string {
		const email = TransformationUtils.extractEmail(data);
		if (!email) {
			throw new Error('Could not extract email from external service data');
		}
		return email;
	}

	/**
	 * Extract first name from external service data
	 */
	static extractFirstName(data: any): string {
		return TransformationUtils.extractString(data, ['firstName', 'first_name'], '');
	}

	/**
	 * Extract last name from external service data
	 */
	static extractLastName(data: any): string {
		return TransformationUtils.extractString(data, ['lastName', 'last_name'], '');
	}

	/**
	 * Extract metadata from external service data
	 */
	static extractMetadata(data: any): Record<string, any> {
		return TransformationUtils.extractMetadata(data);
	}

	// ============================================================================
	// Marketplace-Specific Subscription Data Validation
	// ============================================================================

	/**
	 * Validate marketplace subscription data
	 */
	static validateSubscriptionData(subscriptionData: {
		productId: string;
		status: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			subscriptionData &&
			ValidationUtils.isValidString(subscriptionData.productId) &&
			ValidationUtils.isValidString(subscriptionData.status) &&
			(!subscriptionData.metadata || ValidationUtils.isValidObject(subscriptionData.metadata));

		if (!isValid) {
			this.logger.warn('Invalid marketplace subscription data', { subscriptionData });
		}

		return isValid;
	}

	/**
	 * Extract user ID from external service data
	 */
	static extractUserId(data: any): string {
		return TransformationUtils.extractUserId(data);
	}

	/**
	 * Extract product ID from external service data
	 */
	static extractProductId(data: any): string {
		return TransformationUtils.extractProductId(data);
	}

	/**
	 * Extract status from external service data
	 */
	static extractStatus(data: any): string {
		return TransformationUtils.extractStatus(data);
	}

	/**
	 * Extract transaction ID from external service data
	 */
	static extractTransactionId(data: any): string {
		return TransformationUtils.extractTransactionId(data);
	}

	/**
	 * Extract original transaction ID from external service data
	 */
	static extractOriginalTransactionId(data: any): string {
		return TransformationUtils.extractOriginalTransactionId(data);
	}

	// ============================================================================
	// Marketplace-Specific Data Sanitization
	// ============================================================================

	/**
	 * Sanitize metadata for external APIs
	 */
	static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
		return ValidationUtils.sanitizeObject(metadata);
	}

	/**
	 * Sanitize attributes for external APIs
	 */
	static sanitizeAttributes(attributes: Record<string, any>): Record<string, any> {
		return ValidationUtils.sanitizeObject(attributes);
	}

	// ============================================================================
	// Marketplace-Specific Timestamp Utilities
	// ============================================================================

	/**
	 * Extract created at timestamp from external service data
	 */
	static extractCreatedAt(data: any): string {
		return TransformationUtils.extractCreatedAt(data);
	}

	/**
	 * Extract updated at timestamp from external service data
	 */
	static extractUpdatedAt(data: any): string {
		return TransformationUtils.extractUpdatedAt(data);
	}
}

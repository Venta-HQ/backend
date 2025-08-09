import { Logger } from '@nestjs/common';
import { TransformationUtils, ValidationUtils } from '@venta/utils';

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

	// ============================================================================
	// Marketplace-Specific Data Sanitization
	// ============================================================================
}

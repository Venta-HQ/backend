import {
	MarketplaceExternalSubscriptionData,
	MarketplaceExternalUserData,
	MarketplaceExternalUserMapping,
} from '@app/apitypes/domains/marketplace';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Context Mapper for Marketplace → Communication domain
 *
 * Translates Marketplace domain concepts to Communication domain concepts
 * for external service integrations (Clerk, RevenueCat, etc.)
 * This is an OUTBOUND context mapper from Marketplace domain
 */
@Injectable()
export class MarketplaceToCommunicationContextMapper {
	private readonly logger = new Logger(MarketplaceToCommunicationContextMapper.name);

	// ============================================================================
	// Marketplace → Communication Translation
	// ============================================================================

	/**
	 * Translate marketplace user creation to communication domain format
	 */
	toCommunicationUserCreated(
		marketplaceUserId: string,
		userData: {
			email: string;
			firstName?: string;
			lastName?: string;
			metadata?: Record<string, any>;
		},
	) {
		this.logger.debug('Translating marketplace user creation to communication format', {
			marketplaceUserId,
			email: userData.email,
		});

		return {
			internalUserId: marketplaceUserId,
			userData: {
				email: userData.email,
				firstName: userData.firstName || '',
				lastName: userData.lastName || '',
				metadata: userData.metadata || {},
			},
			timestamp: new Date().toISOString(),
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace user update to communication domain format
	 */
	toCommunicationUserUpdated(
		marketplaceUserId: string,
		updateData: {
			email?: string;
			firstName?: string;
			lastName?: string;
			metadata?: Record<string, any>;
		},
	) {
		this.logger.debug('Translating marketplace user update to communication format', {
			marketplaceUserId,
			updatedFields: Object.keys(updateData),
		});

		return {
			internalUserId: marketplaceUserId,
			updateData,
			timestamp: new Date().toISOString(),
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace user deletion to communication domain format
	 */
	toCommunicationUserDeleted(marketplaceUserId: string) {
		this.logger.debug('Translating marketplace user deletion to communication format', {
			marketplaceUserId,
		});

		return {
			internalUserId: marketplaceUserId,
			timestamp: new Date().toISOString(),
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace subscription creation to communication domain format
	 */
	toCommunicationSubscriptionCreated(
		marketplaceUserId: string,
		subscriptionData: {
			productId: string;
			status: string;
			metadata?: Record<string, any>;
		},
	) {
		this.logger.debug('Translating marketplace subscription creation to communication format', {
			marketplaceUserId,
			productId: subscriptionData.productId,
		});

		return {
			internalUserId: marketplaceUserId,
			subscriptionData: {
				productId: subscriptionData.productId,
				status: subscriptionData.status,
				metadata: subscriptionData.metadata || {},
			},
			timestamp: new Date().toISOString(),
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace external user mapping creation to communication format
	 */
	toCommunicationExternalMapping(mapping: {
		marketplaceUserId: string;
		externalUserId: string;
		service: 'clerk' | 'revenuecat';
	}) {
		this.logger.debug('Translating marketplace external mapping to communication format', {
			marketplaceUserId: mapping.marketplaceUserId,
			service: mapping.service,
		});

		return {
			internalUserId: mapping.marketplaceUserId,
			externalUserId: mapping.externalUserId,
			service: mapping.service,
			timestamp: new Date().toISOString(),
			source: 'marketplace',
		};
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate marketplace user data before translation
	 */
	validateMarketplaceUserData(userData: {
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
			this.logger.warn('Invalid marketplace user data', { userData });
		}

		return isValid;
	}

	/**
	 * Validate marketplace subscription data before translation
	 */
	validateMarketplaceSubscriptionData(subscriptionData: {
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
			this.logger.warn('Invalid marketplace subscription data', { subscriptionData });
		}

		return isValid;
	}

	/**
	 * Validate communication response data
	 */
	validateCommunicationResponse(data: any): boolean {
		const isValid =
			data &&
			typeof data.externalUserId === 'string' &&
			typeof data.service === 'string' &&
			['clerk', 'revenuecat'].includes(data.service) &&
			data.userData &&
			typeof data.userData.email === 'string';

		if (!isValid) {
			this.logger.warn('Invalid communication response data', { data });
		}

		return isValid;
	}

	/**
	 * Validate external service type
	 */
	validateExternalService(service: string): service is 'clerk' | 'revenuecat' {
		const isValid = ['clerk', 'revenuecat'].includes(service);

		if (!isValid) {
			this.logger.warn('Invalid external service type', { service });
		}

		return isValid;
	}
}

import { Injectable, Logger } from '@nestjs/common';
import { 
	MarketplaceExternalUserData,
	MarketplaceExternalUserMapping,
	MarketplaceExternalSubscriptionData
} from '@app/apitypes/domains/marketplace';

/**
 * Context Mapper for Marketplace ↔ Communication domain
 * 
 * Translates between Marketplace domain concepts and Communication domain concepts
 * for external service integrations (Clerk, RevenueCat, etc.)
 */
@Injectable()
export class MarketplaceCommunicationContextMapper {
	private readonly logger = new Logger(MarketplaceCommunicationContextMapper.name);

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
		}
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
		}
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
		}
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
	toCommunicationExternalMapping(
		mapping: {
			marketplaceUserId: string;
			externalUserId: string;
			service: 'clerk' | 'revenuecat';
		}
	) {
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
	// Communication → Marketplace Translation
	// ============================================================================

	/**
	 * Translate communication external user data to marketplace format
	 */
	toMarketplaceExternalUserData(
		communicationData: {
			externalUserId: string;
			service: 'clerk' | 'revenuecat';
			userData: {
				email: string;
				firstName?: string;
				lastName?: string;
				metadata?: Record<string, any>;
			};
			timestamp: string;
		}
	): MarketplaceExternalUserData {
		this.logger.debug('Translating communication external user data to marketplace format', {
			externalUserId: communicationData.externalUserId,
			service: communicationData.service,
		});

		return {
			externalUserId: communicationData.externalUserId,
			service: communicationData.service,
			userData: {
				email: communicationData.userData.email,
				firstName: communicationData.userData.firstName || '',
				lastName: communicationData.userData.lastName || '',
				metadata: communicationData.userData.metadata || {},
			},
			timestamp: communicationData.timestamp,
		};
	}

	/**
	 * Translate communication external user mapping to marketplace format
	 */
	toMarketplaceExternalUserMapping(
		communicationData: {
			internalUserId: string;
			externalUserId: string;
			service: 'clerk' | 'revenuecat';
			timestamp: string;
		}
	): MarketplaceExternalUserMapping {
		this.logger.debug('Translating communication external mapping to marketplace format', {
			internalUserId: communicationData.internalUserId,
			externalUserId: communicationData.externalUserId,
			service: communicationData.service,
		});

		return {
			marketplaceUserId: communicationData.internalUserId,
			externalUserId: communicationData.externalUserId,
			service: communicationData.service,
			timestamp: communicationData.timestamp,
		};
	}

	/**
	 * Translate communication subscription data to marketplace format
	 */
	toMarketplaceExternalSubscriptionData(
		communicationData: {
			externalSubscriptionId: string;
			internalUserId: string;
			service: 'revenuecat';
			subscriptionData: {
				productId: string;
				transactionId: string;
				status: string;
				metadata?: Record<string, any>;
			};
			timestamp: string;
		}
	): MarketplaceExternalSubscriptionData {
		this.logger.debug('Translating communication subscription data to marketplace format', {
			externalSubscriptionId: communicationData.externalSubscriptionId,
			internalUserId: communicationData.internalUserId,
		});

		return {
			externalSubscriptionId: communicationData.externalSubscriptionId,
			marketplaceUserId: communicationData.internalUserId,
			service: communicationData.service,
			subscriptionData: {
				productId: communicationData.subscriptionData.productId,
				transactionId: communicationData.subscriptionData.transactionId,
				status: communicationData.subscriptionData.status,
				metadata: communicationData.subscriptionData.metadata || {},
			},
			timestamp: communicationData.timestamp,
		};
	}

	/**
	 * Translate communication user mapping list to marketplace format
	 */
	toMarketplaceUserMappingList(
		communicationData: Array<{
			internalUserId: string;
			externalUserId: string;
			service: 'clerk' | 'revenuecat';
			timestamp: string;
		}>
	): MarketplaceExternalUserMapping[] {
		this.logger.debug('Translating communication user mapping list to marketplace format', {
			count: communicationData.length,
		});

		return communicationData.map(mapping => this.toMarketplaceExternalUserMapping(mapping));
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
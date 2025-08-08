import { TransformationUtils } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Anti-Corruption Layer for RevenueCat Integration
 *
 * Protects the Marketplace domain from RevenueCat's external API changes
 * and translates RevenueCat data to marketplace domain format
 */
@Injectable()
export class RevenueCatAntiCorruptionLayer {
	private readonly logger = new Logger('RevenueCatAntiCorruptionLayer');

	/**
	 * Validate RevenueCat subscription data
	 */
	private validateRevenueCatSubscription(data: any): boolean {
		return data && data.app_user_id && data.product_id;
	}

	/**
	 * Validate RevenueCat event data
	 */
	private validateRevenueCatEvent(data: any): boolean {
		return data && data.event_type && data.app_user_id;
	}

	/**
	 * Validate RevenueCat user data
	 */
	private validateRevenueCatUser(data: any): boolean {
		return data && data.app_user_id;
	}

	/**
	 * Validate marketplace user data
	 */
	private validateMarketplaceUser(marketplaceUser: any): boolean {
		return marketplaceUser && marketplaceUser.revenueCatUserId;
	}

	/**
	 * Validate marketplace attributes data
	 */
	private validateMarketplaceAttributes(attributes: any): boolean {
		return attributes && typeof attributes === 'object';
	}
	/**
	 * Translate RevenueCat subscription data to marketplace format
	 */
	toMarketplaceSubscription(revenueCatData: any) {
		try {
			// Validate RevenueCat data
			if (!this.validateRevenueCatSubscription(revenueCatData)) {
				throw new Error('Invalid RevenueCat subscription data');
			}

			// Extract and translate subscription data
			const marketplaceSubscription = {
				revenueCatUserId: TransformationUtils.extractUserId(revenueCatData),
				productId: TransformationUtils.extractProductId(revenueCatData),
				status: TransformationUtils.extractStatus(revenueCatData),
				transactionId: TransformationUtils.extractTransactionId(revenueCatData),
				originalTransactionId: TransformationUtils.extractOriginalTransactionId(revenueCatData),
				purchaseDate: TransformationUtils.extractPurchaseDate(revenueCatData),
				expirationDate: TransformationUtils.extractExpirationDate(revenueCatData),
				metadata: TransformationUtils.extractMetadata(revenueCatData),
				platform: TransformationUtils.extractPlatform(revenueCatData),
				environment: TransformationUtils.extractEnvironment(revenueCatData),
			};

			return marketplaceSubscription;
		} catch (error) {
			this.logger.error('Failed to translate RevenueCat subscription to marketplace format', error);
			throw error;
		}
	}

	/**
	 * Translate RevenueCat subscription event to marketplace format
	 */
	toMarketplaceSubscriptionEvent(revenueCatEvent: any) {
		try {
			// Validate RevenueCat event data
			if (!this.validateRevenueCatEvent(revenueCatEvent)) {
				throw new Error('Invalid RevenueCat event data');
			}

			// Extract and translate event data
			const marketplaceEvent = {
				eventType: TransformationUtils.extractEventType(revenueCatEvent),
				revenueCatUserId: TransformationUtils.extractUserId(revenueCatEvent),
				productId: TransformationUtils.extractProductId(revenueCatEvent),
				transactionId: TransformationUtils.extractTransactionId(revenueCatEvent),
				originalTransactionId: TransformationUtils.extractOriginalTransactionId(revenueCatEvent),
				timestamp: TransformationUtils.extractTimestamp(revenueCatEvent),
				metadata: TransformationUtils.extractMetadata(revenueCatEvent),
			};

			return marketplaceEvent;
		} catch (error) {
			this.logger.error('Failed to translate RevenueCat event to marketplace format', error);
			throw error;
		}
	}

	/**
	 * Translate RevenueCat user data to marketplace format
	 */
	toMarketplaceUser(revenueCatUser: any) {
		try {
			// Validate RevenueCat user data
			if (!this.validateRevenueCatUser(revenueCatUser)) {
				throw new Error('Invalid RevenueCat user data');
			}

			// Extract and translate user data
			const marketplaceUser = {
				revenueCatUserId: TransformationUtils.extractUserId(revenueCatUser),
				email: TransformationUtils.extractEmail(revenueCatUser),
				attributes: TransformationUtils.extractAttributes(revenueCatUser),
				subscriptions: TransformationUtils.extractSubscriptions(revenueCatUser),
				createdAt: TransformationUtils.extractCreatedAt(revenueCatUser),
				updatedAt: TransformationUtils.extractUpdatedAt(revenueCatUser),
			};

			return marketplaceUser;
		} catch (error) {
			this.logger.error('Failed to translate RevenueCat user to marketplace format', error);
			throw error;
		}
	}

	// ============================================================================
	// Marketplace → RevenueCat Translation
	// ============================================================================

	/**
	 * Translate marketplace user to RevenueCat format for API calls
	 */
	toRevenueCatUser(marketplaceUser: { revenueCatUserId: string; email?: string; attributes?: Record<string, any> }) {
		try {
			// Validate marketplace user data
			if (!this.validateMarketplaceUser(marketplaceUser)) {
				throw new Error('Invalid marketplace user data');
			}

			// Translate to RevenueCat format
			const revenueCatUser = {
				app_user_id: marketplaceUser.revenueCatUserId,
				email: marketplaceUser.email,
				attributes: marketplaceUser.attributes || {},
			};

			return revenueCatUser;
		} catch (error) {
			this.logger.error('Failed to translate marketplace user to RevenueCat format', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace user attributes to RevenueCat format
	 */
	toRevenueCatAttributes(revenueCatUserId: string, attributes: Record<string, any>) {
		try {
			// Validate marketplace attributes data
			if (!this.validateMarketplaceAttributes(attributes)) {
				throw new Error('Invalid marketplace user attributes');
			}

			// Translate to RevenueCat format
			const revenueCatAttributes = {
				app_user_id: revenueCatUserId,
				attributes: this.sanitizeAttributes(attributes),
			};

			return revenueCatAttributes;
		} catch (error) {
			this.logger.error('Failed to translate marketplace attributes to RevenueCat format', error);
			throw error;
		}
	}

	/**
	 * Sanitize attributes for RevenueCat API
	 */
	private sanitizeAttributes(attributes: Record<string, any>): Record<string, any> {
		const sanitized: Record<string, any> = {};

		for (const [key, value] of Object.entries(attributes)) {
			// RevenueCat has specific requirements for attribute values
			if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
				sanitized[key] = value;
			} else if (value === null || value === undefined) {
				// Skip null/undefined values
				continue;
			} else {
				// Convert complex objects to strings
				sanitized[key] = JSON.stringify(value);
			}
		}

		return sanitized;
	}
}

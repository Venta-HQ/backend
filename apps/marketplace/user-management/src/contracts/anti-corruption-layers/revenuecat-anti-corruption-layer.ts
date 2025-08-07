import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorType, ErrorCodes } from '@app/nest/errors';

/**
 * Anti-Corruption Layer for RevenueCat Integration
 * 
 * Protects the Marketplace domain from RevenueCat's external API changes
 * and translates RevenueCat data to marketplace domain format
 */
@Injectable()
export class RevenueCatAntiCorruptionLayer {
	private readonly logger = new Logger(RevenueCatAntiCorruptionLayer.name);

	// ============================================================================
	// RevenueCat → Marketplace Translation
	// ============================================================================

	/**
	 * Translate RevenueCat subscription data to marketplace format
	 */
	toMarketplaceSubscription(revenueCatData: any) {
		this.logger.debug('Translating RevenueCat subscription to marketplace format', {
			revenueCatUserId: revenueCatData?.app_user_id,
			productId: revenueCatData?.product_id,
		});

		try {
			// Validate RevenueCat data
			if (!this.validateRevenueCatSubscription(revenueCatData)) {
				throw new AppError(
					ErrorType.VALIDATION,
					ErrorCodes.INVALID_EXTERNAL_SUBSCRIPTION_DATA,
					'Invalid RevenueCat subscription data',
					{ revenueCatData }
				);
			}

			// Extract and translate subscription data
			const marketplaceSubscription = {
				revenueCatUserId: this.extractUserId(revenueCatData),
				productId: this.extractProductId(revenueCatData),
				status: this.extractStatus(revenueCatData),
				transactionId: this.extractTransactionId(revenueCatData),
				originalTransactionId: this.extractOriginalTransactionId(revenueCatData),
				purchaseDate: this.extractPurchaseDate(revenueCatData),
				expirationDate: this.extractExpirationDate(revenueCatData),
				metadata: this.extractMetadata(revenueCatData),
				platform: this.extractPlatform(revenueCatData),
				environment: this.extractEnvironment(revenueCatData),
			};

			this.logger.debug('Successfully translated RevenueCat subscription to marketplace format', {
				revenueCatUserId: marketplaceSubscription.revenueCatUserId,
				productId: marketplaceSubscription.productId,
				status: marketplaceSubscription.status,
			});

			return marketplaceSubscription;
		} catch (error) {
			this.logger.error('Failed to translate RevenueCat subscription to marketplace format', error.stack, {
				revenueCatData,
				error,
			});
			throw error;
		}
	}

	/**
	 * Translate RevenueCat subscription event to marketplace format
	 */
	toMarketplaceSubscriptionEvent(revenueCatEvent: any) {
		this.logger.debug('Translating RevenueCat subscription event to marketplace format', {
			eventType: revenueCatEvent?.event_type,
			revenueCatUserId: revenueCatEvent?.app_user_id,
		});

		try {
			// Validate RevenueCat event data
			if (!this.validateRevenueCatEvent(revenueCatEvent)) {
				throw new AppError(
					ErrorType.VALIDATION,
					ErrorCodes.INVALID_EXTERNAL_EVENT_DATA,
					'Invalid RevenueCat event data',
					{ revenueCatEvent }
				);
			}

			// Extract and translate event data
			const marketplaceEvent = {
				eventType: this.extractEventType(revenueCatEvent),
				revenueCatUserId: this.extractUserId(revenueCatEvent),
				productId: this.extractProductId(revenueCatEvent),
				transactionId: this.extractTransactionId(revenueCatEvent),
				originalTransactionId: this.extractOriginalTransactionId(revenueCatEvent),
				timestamp: this.extractTimestamp(revenueCatEvent),
				metadata: this.extractEventMetadata(revenueCatEvent),
			};

			this.logger.debug('Successfully translated RevenueCat event to marketplace format', {
				eventType: marketplaceEvent.eventType,
				revenueCatUserId: marketplaceEvent.revenueCatUserId,
			});

			return marketplaceEvent;
		} catch (error) {
			this.logger.error('Failed to translate RevenueCat event to marketplace format', error.stack, {
				revenueCatEvent,
				error,
			});
			throw error;
		}
	}

	/**
	 * Translate RevenueCat user data to marketplace format
	 */
	toMarketplaceUser(revenueCatUser: any) {
		this.logger.debug('Translating RevenueCat user to marketplace format', {
			revenueCatUserId: revenueCatUser?.app_user_id,
		});

		try {
			// Validate RevenueCat user data
			if (!this.validateRevenueCatUser(revenueCatUser)) {
				throw new AppError(
					ErrorType.VALIDATION,
					ErrorCodes.INVALID_EXTERNAL_USER_DATA,
					'Invalid RevenueCat user data',
					{ revenueCatUser }
				);
			}

			// Extract and translate user data
			const marketplaceUser = {
				revenueCatUserId: this.extractUserId(revenueCatUser),
				email: this.extractEmail(revenueCatUser),
				attributes: this.extractAttributes(revenueCatUser),
				subscriptions: this.extractSubscriptions(revenueCatUser),
				createdAt: this.extractCreatedAt(revenueCatUser),
				updatedAt: this.extractUpdatedAt(revenueCatUser),
			};

			this.logger.debug('Successfully translated RevenueCat user to marketplace format', {
				revenueCatUserId: marketplaceUser.revenueCatUserId,
				email: marketplaceUser.email,
			});

			return marketplaceUser;
		} catch (error) {
			this.logger.error('Failed to translate RevenueCat user to marketplace format', error.stack, {
				revenueCatUser,
				error,
			});
			throw error;
		}
	}

	// ============================================================================
	// Marketplace → RevenueCat Translation
	// ============================================================================

	/**
	 * Translate marketplace user to RevenueCat format for API calls
	 */
	toRevenueCatUser(marketplaceUser: {
		revenueCatUserId: string;
		email?: string;
		attributes?: Record<string, any>;
	}) {
		this.logger.debug('Translating marketplace user to RevenueCat format', {
			revenueCatUserId: marketplaceUser.revenueCatUserId,
		});

		try {
			// Validate marketplace user data
			if (!this.validateMarketplaceUser(marketplaceUser)) {
				throw new AppError(
					ErrorType.VALIDATION,
					ErrorCodes.INVALID_USER_DATA,
					'Invalid marketplace user data',
					{ marketplaceUser }
				);
			}

			// Translate to RevenueCat format
			const revenueCatUser = {
				app_user_id: marketplaceUser.revenueCatUserId,
				email: marketplaceUser.email,
				attributes: marketplaceUser.attributes || {},
			};

			this.logger.debug('Successfully translated marketplace user to RevenueCat format', {
				revenueCatUserId: marketplaceUser.revenueCatUserId,
			});

			return revenueCatUser;
		} catch (error) {
			this.logger.error('Failed to translate marketplace user to RevenueCat format', error.stack, {
				marketplaceUser,
				error,
			});
			throw error;
		}
	}

	/**
	 * Translate marketplace user attributes to RevenueCat format
	 */
	toRevenueCatAttributes(revenueCatUserId: string, attributes: Record<string, any>) {
		this.logger.debug('Translating marketplace user attributes to RevenueCat format', {
			revenueCatUserId,
			attributeCount: Object.keys(attributes).length,
		});

		try {
			// Validate marketplace attributes data
			if (!this.validateMarketplaceAttributes(attributes)) {
				throw new AppError(
					ErrorType.VALIDATION,
					ErrorCodes.INVALID_USER_ATTRIBUTES,
					'Invalid marketplace user attributes',
					{ attributes }
				);
			}

			// Translate to RevenueCat format
			const revenueCatAttributes = {
				app_user_id: revenueCatUserId,
				attributes: this.sanitizeAttributes(attributes),
			};

			this.logger.debug('Successfully translated marketplace attributes to RevenueCat format', {
				revenueCatUserId,
				attributeCount: Object.keys(revenueCatAttributes.attributes).length,
			});

			return revenueCatAttributes;
		} catch (error) {
			this.logger.error('Failed to translate marketplace attributes to RevenueCat format', error.stack, {
				revenueCatUserId,
				attributes,
				error,
			});
			throw error;
		}
	}

	// ============================================================================
	// Data Extraction Methods
	// ============================================================================

	/**
	 * Extract user ID from RevenueCat data
	 */
	private extractUserId(data: any): string {
		return data.app_user_id || data.user_id || data.id;
	}

	/**
	 * Extract product ID from RevenueCat data
	 */
	private extractProductId(data: any): string {
		return data.product_id || data.productId;
	}

	/**
	 * Extract status from RevenueCat data
	 */
	private extractStatus(data: any): string {
		return data.status || data.subscription_status || 'unknown';
	}

	/**
	 * Extract transaction ID from RevenueCat data
	 */
	private extractTransactionId(data: any): string {
		return data.transaction_id || data.transactionId || '';
	}

	/**
	 * Extract original transaction ID from RevenueCat data
	 */
	private extractOriginalTransactionId(data: any): string {
		return data.original_transaction_id || data.originalTransactionId || '';
	}

	/**
	 * Extract purchase date from RevenueCat data
	 */
	private extractPurchaseDate(data: any): string {
		return data.purchase_date || data.purchaseDate || data.created_at || new Date().toISOString();
	}

	/**
	 * Extract expiration date from RevenueCat data
	 */
	private extractExpirationDate(data: any): string {
		return data.expiration_date || data.expirationDate || data.expires_at || '';
	}

	/**
	 * Extract metadata from RevenueCat data
	 */
	private extractMetadata(data: any): Record<string, any> {
		return data.metadata || data.attributes || {};
	}

	/**
	 * Extract platform from RevenueCat data
	 */
	private extractPlatform(data: any): string {
		return data.platform || data.store || 'unknown';
	}

	/**
	 * Extract environment from RevenueCat data
	 */
	private extractEnvironment(data: any): string {
		return data.environment || 'production';
	}

	/**
	 * Extract event type from RevenueCat event data
	 */
	private extractEventType(data: any): string {
		return data.event_type || data.type || 'unknown';
	}

	/**
	 * Extract timestamp from RevenueCat event data
	 */
	private extractTimestamp(data: any): string {
		return data.timestamp || data.created_at || new Date().toISOString();
	}

	/**
	 * Extract event metadata from RevenueCat event data
	 */
	private extractEventMetadata(data: any): Record<string, any> {
		return data.event_metadata || data.metadata || {};
	}

	/**
	 * Extract email from RevenueCat user data
	 */
	private extractEmail(data: any): string {
		return data.email || '';
	}

	/**
	 * Extract attributes from RevenueCat user data
	 */
	private extractAttributes(data: any): Record<string, any> {
		return data.attributes || {};
	}

	/**
	 * Extract subscriptions from RevenueCat user data
	 */
	private extractSubscriptions(data: any): any[] {
		return data.subscriptions || data.entitlements || [];
	}

	/**
	 * Extract created at timestamp from RevenueCat user data
	 */
	private extractCreatedAt(data: any): string {
		return data.created_at || data.createdAt || new Date().toISOString();
	}

	/**
	 * Extract updated at timestamp from RevenueCat user data
	 */
	private extractUpdatedAt(data: any): string {
		return data.updated_at || data.updatedAt || new Date().toISOString();
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

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate RevenueCat subscription data
	 */
	private validateRevenueCatSubscription(data: any): boolean {
		const isValid = 
			data &&
			typeof data.app_user_id === 'string' &&
			data.app_user_id.length > 0 &&
			typeof data.product_id === 'string' &&
			data.product_id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid RevenueCat subscription data', { data });
		}

		return isValid;
	}

	/**
	 * Validate RevenueCat event data
	 */
	private validateRevenueCatEvent(data: any): boolean {
		const isValid = 
			data &&
			typeof data.event_type === 'string' &&
			data.event_type.length > 0 &&
			typeof data.app_user_id === 'string' &&
			data.app_user_id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid RevenueCat event data', { data });
		}

		return isValid;
	}

	/**
	 * Validate RevenueCat user data
	 */
	private validateRevenueCatUser(data: any): boolean {
		const isValid = 
			data &&
			typeof data.app_user_id === 'string' &&
			data.app_user_id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid RevenueCat user data', { data });
		}

		return isValid;
	}

	/**
	 * Validate marketplace user data
	 */
	private validateMarketplaceUser(marketplaceUser: {
		revenueCatUserId: string;
		email?: string;
		attributes?: Record<string, any>;
	}): boolean {
		const isValid = 
			marketplaceUser &&
			typeof marketplaceUser.revenueCatUserId === 'string' &&
			marketplaceUser.revenueCatUserId.length > 0 &&
			(!marketplaceUser.email || typeof marketplaceUser.email === 'string') &&
			(!marketplaceUser.attributes || typeof marketplaceUser.attributes === 'object');

		if (!isValid) {
			this.logger.warn('Invalid marketplace user data', { marketplaceUser });
		}

		return isValid;
	}

	/**
	 * Validate marketplace attributes data
	 */
	private validateMarketplaceAttributes(attributes: Record<string, any>): boolean {
		const isValid = 
			attributes &&
			typeof attributes === 'object' &&
			!Array.isArray(attributes);

		if (!isValid) {
			this.logger.warn('Invalid marketplace attributes data', { attributes });
		}

		return isValid;
	}
} 
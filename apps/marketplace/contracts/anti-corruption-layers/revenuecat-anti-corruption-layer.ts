import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
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
					{ revenueCatData },
				);
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
					{ revenueCatEvent },
				);
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
					{ revenueCatUser },
				);
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
	toRevenueCatUser(marketplaceUser: { revenueCatUserId: string; email?: string; attributes?: Record<string, any> }) {
		this.logger.debug('Translating marketplace user to RevenueCat format', {
			revenueCatUserId: marketplaceUser.revenueCatUserId,
		});

		try {
			// Validate marketplace user data
			if (!this.validateMarketplaceUser(marketplaceUser)) {
				throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_USER_DATA, 'Invalid marketplace user data', {
					marketplaceUser,
				});
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
					{ attributes },
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
		const isValid = data && typeof data.app_user_id === 'string' && data.app_user_id.length > 0;

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
		const isValid = attributes && typeof attributes === 'object' && !Array.isArray(attributes);

		if (!isValid) {
			this.logger.warn('Invalid marketplace attributes data', { attributes });
		}

		return isValid;
	}
}

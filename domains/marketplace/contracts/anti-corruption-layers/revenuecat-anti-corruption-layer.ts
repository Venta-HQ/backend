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
	 * Create a validation error with consistent formatting
	 */
	private createValidationError(message: string, context: Record<string, unknown>): Error {
		this.logger.error(message, context);
		return new Error(message);
	}

	/**
	 * Validate RevenueCat subscription data
	 */
	private validateRevenueCatSubscription(data: unknown): boolean {
		if (!data || typeof data !== 'object') return false;
		const d = data as Record<string, unknown>;

		return (
			typeof d.app_user_id === 'string' &&
			typeof d.product_id === 'string' &&
			(!d.transaction_id || typeof d.transaction_id === 'string') &&
			(!d.original_transaction_id || typeof d.original_transaction_id === 'string') &&
			(!d.purchase_date || typeof d.purchase_date === 'string') &&
			(!d.expiration_date || typeof d.expiration_date === 'string')
		);
	}

	/**
	 * Validate RevenueCat event data
	 */
	private validateRevenueCatEvent(data: unknown): boolean {
		if (!data || typeof data !== 'object') return false;
		const d = data as Record<string, unknown>;

		return (
			typeof d.event_type === 'string' &&
			typeof d.app_user_id === 'string' &&
			(!d.product_id || typeof d.product_id === 'string') &&
			(!d.transaction_id || typeof d.transaction_id === 'string')
		);
	}

	/**
	 * Validate RevenueCat user data
	 */
	private validateRevenueCatUser(data: unknown): boolean {
		if (!data || typeof data !== 'object') return false;
		const d = data as Record<string, unknown>;

		return (
			typeof d.app_user_id === 'string' &&
			(!d.email || typeof d.email === 'string') &&
			(!d.attributes || (typeof d.attributes === 'object' && !Array.isArray(d.attributes))) &&
			(!d.subscriptions || (typeof d.subscriptions === 'object' && !Array.isArray(d.subscriptions)))
		);
	}

	/**
	 * Validate marketplace user data
	 */
	private validateMarketplaceUser(marketplaceUser: unknown): boolean {
		if (!marketplaceUser || typeof marketplaceUser !== 'object') return false;
		const d = marketplaceUser as Record<string, unknown>;

		return (
			typeof d.revenueCatUserId === 'string' &&
			(!d.email || typeof d.email === 'string') &&
			(!d.attributes || (typeof d.attributes === 'object' && !Array.isArray(d.attributes)))
		);
	}

	/**
	 * Validate marketplace attributes data
	 */
	private validateMarketplaceAttributes(attributes: unknown): boolean {
		return attributes !== null && typeof attributes === 'object' && !Array.isArray(attributes);
	}

	/**
	 * Validate subscription activation data from RevenueCat
	 */
	public validateSubscriptionActivationData(data: {
		clerkUserId: string;
		providerId: string;
		subscriptionData?: {
			eventId: string;
			productId: string;
			transactionId: string;
		};
	}): {
		clerkUserId: string;
		providerId: string;
		subscriptionData?: {
			eventId: string;
			productId: string;
			transactionId: string;
		};
	} {
		if (!data || !data.clerkUserId || typeof data.clerkUserId !== 'string') {
			throw this.createValidationError('Invalid subscription activation data - missing or invalid clerkUserId', {
				data,
			});
		}

		if (!data.providerId || typeof data.providerId !== 'string') {
			throw this.createValidationError('Invalid subscription activation data - missing or invalid providerId', {
				data,
			});
		}

		if (data.subscriptionData) {
			const { eventId, productId, transactionId } = data.subscriptionData;

			if (!eventId || typeof eventId !== 'string') {
				throw this.createValidationError('Invalid subscription data - missing or invalid eventId', { data });
			}

			if (!productId || typeof productId !== 'string') {
				throw this.createValidationError('Invalid subscription data - missing or invalid productId', { data });
			}

			if (!transactionId || typeof transactionId !== 'string') {
				throw this.createValidationError('Invalid subscription data - missing or invalid transactionId', { data });
			}
		}

		return data;
	}

	/**
	 * Validate subscription update data from RevenueCat
	 */
	public validateSubscriptionUpdateData(data: {
		revenueCatUserId: string;
		productId: string;
		updates: {
			status?: string;
			expirationDate?: string;
			metadata?: Record<string, unknown>;
		};
	}): {
		revenueCatUserId: string;
		productId: string;
		updates: {
			status?: string;
			expirationDate?: string;
			metadata?: Record<string, unknown>;
		};
	} {
		if (!data || !data.revenueCatUserId || typeof data.revenueCatUserId !== 'string') {
			throw this.createValidationError('Invalid subscription update data - missing or invalid revenueCatUserId', {
				data,
			});
		}

		if (!data.productId || typeof data.productId !== 'string') {
			throw this.createValidationError('Invalid subscription update data - missing or invalid productId', { data });
		}

		if (!data.updates || typeof data.updates !== 'object') {
			throw this.createValidationError('Invalid subscription update data - missing updates', { data });
		}

		const { status, expirationDate, metadata } = data.updates;

		if (status !== undefined && typeof status !== 'string') {
			throw this.createValidationError('Invalid subscription update data - invalid status', { data });
		}

		if (expirationDate !== undefined && typeof expirationDate !== 'string') {
			throw this.createValidationError('Invalid subscription update data - invalid expirationDate', { data });
		}

		if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
			throw this.createValidationError('Invalid subscription update data - invalid metadata', { data });
		}

		return data;
	}
	/**
	 * Translate RevenueCat subscription data to marketplace format
	 */
	toMarketplaceSubscription(revenueCatData: unknown) {
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
	toMarketplaceSubscriptionEvent(revenueCatEvent: unknown) {
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
	toMarketplaceUser(revenueCatUser: unknown) {
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
	toRevenueCatUser(marketplaceUser: {
		revenueCatUserId: string;
		email?: string;
		attributes?: Record<string, unknown>;
	}) {
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
	toRevenueCatAttributes(revenueCatUserId: string, attributes: Record<string, unknown>) {
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
	private sanitizeAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
		const sanitized: Record<string, unknown> = {};

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

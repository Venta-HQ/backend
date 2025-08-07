import { Injectable } from '@nestjs/common';
import { BaseAntiCorruptionLayer } from '@app/nest/modules/contracts';

/**
 * Anti-Corruption Layer for Vendor Management ↔ RevenueCat Integration
 *
 * Protects the Vendor Management domain from RevenueCat's external API changes
 * and translates RevenueCat data to vendor management domain format
 */
@Injectable()
export class VendorRevenueCatAntiCorruptionLayer extends BaseAntiCorruptionLayer {
	constructor() {
		super('VendorRevenueCatAntiCorruptionLayer');
	}

	getExternalService(): string {
		return 'revenuecat';
	}

	getDomain(): string {
		return 'marketplace';
	}

	validateExternalData(data: any): boolean {
		return this.validateExternalSubscription(data);
	}

	validateMarketplaceData(data: any): boolean {
		return this.validateMarketplaceSubscription(data);
	}

	// ============================================================================
	// RevenueCat → Marketplace Translation
	// ============================================================================

	/**
	 * Translate RevenueCat subscription data to marketplace vendor format
	 */
	toMarketplaceVendorSubscription(revenueCatData: any) {
		this.logTranslationStart('toMarketplaceVendorSubscription', { 
			appUserId: revenueCatData?.app_user_id 
		});

		try {
			if (!this.validateExternalData(revenueCatData)) {
				throw this.createValidationError('Invalid RevenueCat subscription data', { revenueCatData });
			}

			const result = {
				vendorId: this.extractUserId(revenueCatData),
				productId: this.extractProductId(revenueCatData),
				status: this.extractStatus(revenueCatData),
				transactionId: this.extractTransactionId(revenueCatData),
				originalTransactionId: this.extractOriginalTransactionId(revenueCatData),
				metadata: this.extractMetadata(revenueCatData),
				createdAt: this.extractCreatedAt(revenueCatData),
				updatedAt: this.extractUpdatedAt(revenueCatData),
				// Vendor-specific fields
				subscriptionType: this.extractSubscriptionType(revenueCatData),
				billingCycle: this.extractBillingCycle(revenueCatData),
				nextBillingDate: this.extractNextBillingDate(revenueCatData),
			};

			this.logTranslationSuccess('toMarketplaceVendorSubscription', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorSubscription', error, { revenueCatData });
			throw error;
		}
	}

	/**
	 * Translate RevenueCat event data to marketplace vendor format
	 */
	toMarketplaceVendorEvent(revenueCatEvent: any) {
		this.logTranslationStart('toMarketplaceVendorEvent', { 
			eventType: revenueCatEvent?.event_type,
			appUserId: revenueCatEvent?.app_user_id 
		});

		try {
			if (!this.validateExternalEvent(revenueCatEvent)) {
				throw this.createValidationError('Invalid RevenueCat event data', { revenueCatEvent });
			}

			const result = {
				vendorId: this.extractUserId(revenueCatEvent),
				eventType: revenueCatEvent.event_type,
				productId: this.extractProductId(revenueCatEvent),
				transactionId: this.extractTransactionId(revenueCatEvent),
				metadata: this.extractMetadata(revenueCatEvent),
				timestamp: new Date().toISOString(),
				// Vendor-specific fields
				subscriptionAction: this.extractSubscriptionAction(revenueCatEvent),
				price: this.extractPrice(revenueCatEvent),
				currency: this.extractCurrency(revenueCatEvent),
			};

			this.logTranslationSuccess('toMarketplaceVendorEvent', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorEvent', error, { revenueCatEvent });
			throw error;
		}
	}

	// ============================================================================
	// Marketplace → RevenueCat Translation
	// ============================================================================

	/**
	 * Translate marketplace vendor subscription to RevenueCat format
	 */
	toRevenueCatVendorSubscription(marketplaceSubscription: {
		vendorId: string;
		productId: string;
		status: string;
		metadata?: Record<string, any>;
	}) {
		this.logTranslationStart('toRevenueCatVendorSubscription', { 
			vendorId: marketplaceSubscription.vendorId 
		});

		try {
			if (!this.validateMarketplaceData(marketplaceSubscription)) {
				throw this.createValidationError('Invalid marketplace subscription data', { marketplaceSubscription });
			}

			const result = {
				app_user_id: marketplaceSubscription.vendorId,
				product_id: marketplaceSubscription.productId,
				status: marketplaceSubscription.status,
				metadata: this.sanitizeAttributes(marketplaceSubscription.metadata || {}),
				environment: 'production',
			};

			this.logTranslationSuccess('toRevenueCatVendorSubscription', result);
			return result;
		} catch (error) {
			this.logTranslationError('toRevenueCatVendorSubscription', error, { marketplaceSubscription });
			throw error;
		}
	}

	/**
	 * Translate marketplace vendor subscription update to RevenueCat format
	 */
	toRevenueCatVendorSubscriptionUpdate(
		vendorId: string,
		updates: {
			productId?: string;
			status?: string;
			metadata?: Record<string, any>;
		},
	) {
		this.logTranslationStart('toRevenueCatVendorSubscriptionUpdate', { vendorId, updates });

		try {
			const result: Record<string, any> = {
				app_user_id: vendorId,
			};

			if (updates.productId) {
				result.product_id = updates.productId;
			}

			if (updates.status) {
				result.status = updates.status;
			}

			if (updates.metadata) {
				result.metadata = this.sanitizeAttributes(updates.metadata);
			}

			this.logTranslationSuccess('toRevenueCatVendorSubscriptionUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toRevenueCatVendorSubscriptionUpdate', error, { vendorId, updates });
			throw error;
		}
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate marketplace subscription data
	 */
	private validateMarketplaceSubscription(subscription: any): boolean {
		const isValid =
			subscription &&
			typeof subscription.vendorId === 'string' &&
			subscription.vendorId.length > 0 &&
			typeof subscription.productId === 'string' &&
			subscription.productId.length > 0 &&
			typeof subscription.status === 'string' &&
			subscription.status.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid marketplace subscription data', { subscription });
		}

		return isValid;
	}

	// ============================================================================
	// Vendor-Specific Data Extraction Methods
	// ============================================================================

	/**
	 * Extract subscription type from RevenueCat data
	 */
	private extractSubscriptionType(revenueCatData: any): string {
		return revenueCatData.metadata?.subscription_type || 'standard';
	}

	/**
	 * Extract billing cycle from RevenueCat data
	 */
	private extractBillingCycle(revenueCatData: any): string {
		return revenueCatData.metadata?.billing_cycle || 'monthly';
	}

	/**
	 * Extract next billing date from RevenueCat data
	 */
	private extractNextBillingDate(revenueCatData: any): string {
		return revenueCatData.metadata?.next_billing_date || '';
	}

	/**
	 * Extract subscription action from RevenueCat event
	 */
	private extractSubscriptionAction(revenueCatEvent: any): string {
		return revenueCatEvent.metadata?.subscription_action || 'unknown';
	}

	/**
	 * Extract price from RevenueCat event
	 */
	private extractPrice(revenueCatEvent: any): number {
		return revenueCatEvent.metadata?.price || 0;
	}

	/**
	 * Extract currency from RevenueCat event
	 */
	private extractCurrency(revenueCatEvent: any): string {
		return revenueCatEvent.metadata?.currency || 'USD';
	}
} 
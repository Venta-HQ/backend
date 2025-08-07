import { Injectable } from '@nestjs/common';
import { BaseContextMapper } from '@app/nest/modules/contracts';

/**
 * Context Mapper for Vendor Management ↔ Communication Services
 *
 * Translates between Vendor Management domain concepts and Communication domain concepts
 * for external service integrations (Clerk, RevenueCat, etc.)
 */
@Injectable()
export class VendorCommunicationContextMapper extends BaseContextMapper {
	constructor() {
		super('VendorCommunicationContextMapper');
	}

	getDomain(): string {
		return 'marketplace';
	}

	getTargetDomain(): string {
		return 'communication';
	}

	validateSourceData(data: any): boolean {
		if (data.userData) {
			return this.validateUserData(data.userData);
		}
		if (data.subscriptionData) {
			return this.validateSubscriptionData(data.subscriptionData);
		}
		return true;
	}

	validateTargetData(data: any): boolean {
		return this.validateCommunicationResponse(data);
	}

	// ============================================================================
	// Marketplace → Communication Translation
	// ============================================================================

	/**
	 * Translate marketplace vendor user data to communication format for Clerk
	 */
	toCommunicationVendorUser(vendorUser: {
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}) {
		this.logTranslationStart('toCommunicationVendorUser', { email: vendorUser.email });

		try {
			if (!this.validateSourceData({ userData: vendorUser })) {
				throw this.createValidationError('Invalid vendor user data', { vendorUser });
			}

			const result = {
				emailAddress: [vendorUser.email],
				firstName: vendorUser.firstName || '',
				lastName: vendorUser.lastName || '',
				publicMetadata: this.sanitizeMetadata(vendorUser.metadata || {}),
				externalId: `vendor_${vendorUser.email}`, // Unique identifier for vendors
			};

			this.logTranslationSuccess('toCommunicationVendorUser', result);
			return result;
		} catch (error) {
			this.logTranslationError('toCommunicationVendorUser', error, { vendorUser });
			throw error;
		}
	}

	/**
	 * Translate marketplace vendor subscription data to communication format for RevenueCat
	 */
	toCommunicationVendorSubscription(vendorId: string, subscriptionData: {
		productId: string;
		status: string;
		metadata?: Record<string, any>;
	}) {
		this.logTranslationStart('toCommunicationVendorSubscription', { vendorId, subscriptionData });

		try {
			if (!this.validateSourceData({ subscriptionData })) {
				throw this.createValidationError('Invalid vendor subscription data', { vendorId, subscriptionData });
			}

			const result = {
				app_user_id: vendorId,
				product_id: subscriptionData.productId,
				status: subscriptionData.status,
				metadata: this.sanitizeMetadata(subscriptionData.metadata || {}),
				environment: 'production',
			};

			this.logTranslationSuccess('toCommunicationVendorSubscription', result);
			return result;
		} catch (error) {
			this.logTranslationError('toCommunicationVendorSubscription', error, { vendorId, subscriptionData });
			throw error;
		}
	}

	/**
	 * Translate marketplace vendor update to communication format
	 */
	toCommunicationVendorUpdate(vendorId: string, updates: {
		email?: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
	}) {
		this.logTranslationStart('toCommunicationVendorUpdate', { vendorId, updates });

		try {
			const result: Record<string, any> = {};

			if (updates.email) {
				result.emailAddress = [updates.email];
			}

			if (updates.firstName !== undefined) {
				result.firstName = updates.firstName;
			}

			if (updates.lastName !== undefined) {
				result.lastName = updates.lastName;
			}

			if (updates.metadata) {
				result.publicMetadata = this.sanitizeMetadata(updates.metadata);
			}

			this.logTranslationSuccess('toCommunicationVendorUpdate', result);
			return result;
		} catch (error) {
			this.logTranslationError('toCommunicationVendorUpdate', error, { vendorId, updates });
			throw error;
		}
	}

	// ============================================================================
	// Communication → Marketplace Translation
	// ============================================================================

	/**
	 * Translate communication vendor user data to marketplace format
	 */
	toMarketplaceVendorUser(communicationData: {
		id: string;
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
		createdAt: string;
		updatedAt: string;
	}) {
		this.logTranslationStart('toMarketplaceVendorUser', { id: communicationData.id });

		try {
			if (!this.validateTargetData(communicationData)) {
				throw this.createValidationError('Invalid communication vendor data', { communicationData });
			}

			const result = {
				externalId: communicationData.id,
				email: communicationData.email,
				firstName: communicationData.firstName || '',
				lastName: communicationData.lastName || '',
				metadata: communicationData.metadata || {},
				createdAt: communicationData.createdAt,
				updatedAt: communicationData.updatedAt,
			};

			this.logTranslationSuccess('toMarketplaceVendorUser', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorUser', error, { communicationData });
			throw error;
		}
	}

	/**
	 * Translate communication subscription data to marketplace format
	 */
	toMarketplaceVendorSubscription(communicationData: {
		app_user_id: string;
		product_id: string;
		status: string;
		metadata?: Record<string, any>;
		created_at: string;
		updated_at: string;
	}) {
		this.logTranslationStart('toMarketplaceVendorSubscription', { app_user_id: communicationData.app_user_id });

		try {
			if (!this.validateTargetData(communicationData)) {
				throw this.createValidationError('Invalid communication subscription data', { communicationData });
			}

			const result = {
				vendorId: communicationData.app_user_id,
				productId: communicationData.product_id,
				status: communicationData.status,
				metadata: communicationData.metadata || {},
				createdAt: communicationData.created_at,
				updatedAt: communicationData.updated_at,
			};

			this.logTranslationSuccess('toMarketplaceVendorSubscription', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorSubscription', error, { communicationData });
			throw error;
		}
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate communication response data
	 */
	private validateCommunicationResponse(data: any): boolean {
		const isValid =
			data &&
			typeof data.id === 'string' &&
			data.id.length > 0 &&
			typeof data.email === 'string' &&
			data.email.includes('@');

		if (!isValid) {
			this.logger.warn('Invalid communication response data', { data });
		}

		return isValid;
	}
} 
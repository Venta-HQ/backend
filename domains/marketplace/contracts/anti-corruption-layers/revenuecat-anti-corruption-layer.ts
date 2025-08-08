import { AppError } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for RevenueCat integration
 */
@Injectable()
export class RevenueCatAntiCorruptionLayer {
	private readonly logger = new Logger(RevenueCatAntiCorruptionLayer.name);

	/**
	 * Validate subscription data
	 */
	validateSubscriptionData(data: unknown): data is Marketplace.External.RevenueCatSubscription {
		try {
			if (!data || typeof data !== 'object') return false;
			const subscription = data as Marketplace.External.RevenueCatSubscription;

			return (
				typeof subscription.id === 'string' &&
				typeof subscription.user_id === 'string' &&
				typeof subscription.product_id === 'string' &&
				typeof subscription.transaction_id === 'string' &&
				['active', 'cancelled', 'expired'].includes(subscription.status) &&
				['normal', 'trial'].includes(subscription.period_type) &&
				typeof subscription.purchased_at === 'string' &&
				(!subscription.expires_at || typeof subscription.expires_at === 'string')
			);
		} catch (error) {
			this.logger.error('Failed to validate subscription data', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Convert RevenueCat subscription to domain subscription
	 */
	toDomainSubscription(subscription: Marketplace.External.RevenueCatSubscription): Marketplace.Core.UserSubscription {
		return {
			id: subscription.id,
			userId: subscription.user_id,
			status: subscription.status,
			provider: 'revenuecat',
			externalId: subscription.transaction_id,
			productId: subscription.product_id,
			startDate: subscription.purchased_at,
			endDate: subscription.expires_at,
		};
	}

	/**
	 * Handle RevenueCat error
	 */
	handleRevenueCatError(error: unknown, context: { operation: string; userId?: string }): never {
		this.logger.error('RevenueCat operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			userId: context.userId,
		});

		throw AppError.internal('SUBSCRIPTION_SERVICE_ERROR', 'RevenueCat operation failed', context);
	}
}

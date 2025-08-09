import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';
import { GrpcSubscriptionDataSchema, RevenueCatSubscriptionSchema } from '../types/user/user.schemas';

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
		const result = GrpcSubscriptionDataSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_SUB_INVALID_DATA, {
				errors: result.error.errors,
				data,
			});
		}
		return true;
	}

	/**
	 * Validate RevenueCat subscription data
	 */
	validateRevenueCatSubscription(data: unknown): data is Marketplace.External.RevenueCatSubscription {
		const result = RevenueCatSubscriptionSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_SUB_INVALID_DATA, {
				errors: result.error.errors,
				userId: (data as any)?.user_id || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Convert RevenueCat subscription to domain subscription
	 */
	toDomainSubscription(subscription: Marketplace.External.RevenueCatSubscription): Marketplace.Core.UserSubscription {
		if (!subscription?.id || !subscription?.user_id || !subscription?.product_id || !subscription?.transaction_id) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !subscription?.id
					? 'id'
					: !subscription?.user_id
						? 'user_id'
						: !subscription?.product_id
							? 'product_id'
							: 'transaction_id',
				userId: subscription?.user_id || 'undefined',
				subscriptionId: subscription?.id || 'undefined',
			});
		}

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

		throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
			service: 'revenuecat',
			message: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			userId: context.userId,
		});
	}
}

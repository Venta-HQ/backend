import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { CreateSubscriptionData } from '@venta/proto/marketplace/user-management';
import { GrpcSubscriptionDataSchema, RevenueCatSubscriptionSchema } from '../../schemas/user/user.schemas';
import type { SubscriptionCreate } from '../../types/domain';
import type { RevenueCatSubscription, UserSubscription } from '../../types/internal';

// ============================================================================
// EXTERNAL REVENUECAT ACL PIPES - Transform RevenueCat API types to domain types
// ============================================================================

/**
 * RevenueCat Subscription ACL Pipe
 * Transforms gRPC CreateSubscriptionData to validated subscription data
 */
@Injectable()
export class RevenueCatSubscriptionACLPipe implements PipeTransform<CreateSubscriptionData, SubscriptionCreate> {
	private validator = new SchemaValidatorPipe(GrpcSubscriptionDataSchema);

	transform(value: CreateSubscriptionData, metadata: ArgumentMetadata): SubscriptionCreate {
		const validated = this.validator.transform(value, metadata);
		return {
			userId: validated.clerkUserId, // Map clerkUserId to userId
			providerId: validated.providerId,
			data: validated.data,
		};
	}
}

/**
 * RevenueCat Subscription Transform ACL Pipe
 * Transforms external RevenueCat subscription data to internal domain subscription
 */
@Injectable()
export class RevenueCatSubscriptionTransformACLPipe implements PipeTransform<RevenueCatSubscription, UserSubscription> {
	private validator = new SchemaValidatorPipe(RevenueCatSubscriptionSchema);

	transform(value: RevenueCatSubscription, metadata: ArgumentMetadata): UserSubscription {
		const validated = this.validator.transform(value, metadata);

		return {
			id: validated.id,
			userId: validated.app_user_id,
			productId: validated.product_identifier,
			planType: validated.product_identifier, // Map product identifier to plan type
			status: validated.expires_date && new Date(validated.expires_date) > new Date() ? 'active' : 'expired',
			currentPeriodStart: validated.purchase_date,
			currentPeriodEnd: validated.expires_date,
			cancelAtPeriodEnd: false, // RevenueCat doesn't provide this directly
			createdAt: validated.purchase_date,
			updatedAt: new Date().toISOString(),
		};
	}
}

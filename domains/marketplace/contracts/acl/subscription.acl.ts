import type { CreateSubscriptionData } from '@venta/proto/marketplace/user-management';
import { validateSchema } from '@venta/utils';
import { grpcSubscriptionCreateSchema } from '../schemas/subscription.schemas';
// Validation utilities
import type { SubscriptionCreate } from '../types/domain';

/**
 * Subscription ACL
 *
 * Handles transformation between subscription gRPC data and internal domain types.
 * This processes subscription data that has already been processed through webhook handlers.
 */
export class SubscriptionCreateACL {
	/**
	 * Validate subscription data from gRPC
	 */
	static validateIncoming(grpc: CreateSubscriptionData): void {
		validateSchema(grpcSubscriptionCreateSchema, grpc);
	}

	/**
	 * Transform subscription gRPC data to internal domain subscription create type
	 */
	static toDomain(grpc: CreateSubscriptionData): SubscriptionCreate {
		this.validateIncoming(grpc);

		return {
			userId: grpc.clerkUserId,
			provider: grpc.provider,
			data: grpc.data,
		};
	}
}

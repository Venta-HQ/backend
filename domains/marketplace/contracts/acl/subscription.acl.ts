import type { CreateSubscriptionData } from '@venta/proto/marketplace/user-management';
// Validation utilities
import { validateRequiredString, validateSubscriptionData } from '../schemas/validation.utils';
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
	static validate(grpc: CreateSubscriptionData): void {
		validateRequiredString(grpc.clerkUserId, 'clerkUserId');
		validateRequiredString(grpc.providerId, 'providerId');
		validateSubscriptionData(grpc.data);
	}

	/**
	 * Transform subscription gRPC data to internal domain subscription create type
	 */
	static toDomain(grpc: CreateSubscriptionData): SubscriptionCreate {
		this.validate(grpc);

		return {
			userId: grpc.clerkUserId,
			providerId: grpc.providerId,
			data: validateSubscriptionData(grpc.data),
		};
	}

	/**
	 * Validate domain subscription create data
	 */
	static validateDomain(domain: SubscriptionCreate): void {
		validateRequiredString(domain.userId, 'userId');
		validateRequiredString(domain.providerId, 'providerId');
		validateSubscriptionData(domain.data);
	}

	/**
	 * Transform internal domain subscription to gRPC format
	 */
	static toGrpc(domain: SubscriptionCreate): CreateSubscriptionData {
		this.validateDomain(domain);

		return {
			clerkUserId: domain.userId,
			providerId: domain.providerId,
			data: domain.data,
		};
	}
}

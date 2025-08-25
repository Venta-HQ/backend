import { SubscriptionProvider as PrismaProvider } from '@prisma/client';
import {
	CreateSubscriptionData,
	SubscriptionProvider as GrpcSubscriptionProvider,
} from '@venta/proto/marketplace/user-management';
import { validateSchema } from '@venta/utils';
import { domainSubscriptionCreateSchema, grpcSubscriptionCreateSchema } from '../schemas/subscription.schemas';
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
	 * Transform subscription gRPC data to internal domain subscription create type
	 * Single validation pass is performed AFTER mapping to Prisma provider enum
	 */
	static toDomain(grpc: CreateSubscriptionData): SubscriptionCreate {
		// Validate raw gRPC payload first (shape + provider enum semantics)
		validateSchema(grpcSubscriptionCreateSchema, grpc);

		// Map gRPC enum to Prisma enum at the contract boundary
		const providerMap: Record<number, PrismaProvider> = {
			[GrpcSubscriptionProvider.REVENUECAT]: PrismaProvider.revenuecat,
		};
		const provider = providerMap[grpc.provider];
		if (!provider) {
			throw new Error(`Unsupported subscription provider: ${grpc.provider}`);
		}

		const domain: SubscriptionCreate = {
			userId: grpc.clerkUserId,
			provider,
			data: grpc.data,
		};

		// Validate Prisma/domain payload once
		validateSchema(domainSubscriptionCreateSchema, domain);
		return domain;
	}
}

import { z } from 'zod';
import { SubscriptionProvider as PrismaSubscriptionProvider } from '@prisma/client';
import { SubscriptionProvider as GrpcSubscriptionProvider } from '@venta/proto/marketplace/user-management';

const grpcSubscriptionProviderDataSchema = z.object({
	eventId: z.string(),
	productId: z.string(),
	transactionId: z.string(),
});

// Incoming from gRPC (enum serialized as number). Ensure it's a valid enum and not UNSPECIFIED
export const grpcSubscriptionCreateSchema = z.object({
	clerkUserId: z.string(),
	provider: z
		.nativeEnum(GrpcSubscriptionProvider)
		.refine((v) => v !== GrpcSubscriptionProvider.SUBSCRIPTION_PROVIDER_UNSPECIFIED, {
			message: 'provider must be specified',
		}),
	data: grpcSubscriptionProviderDataSchema,
});

// Internal/domain payload validated against Prisma enum
export const domainSubscriptionCreateSchema = z.object({
	userId: z.string(),
	provider: z.nativeEnum(PrismaSubscriptionProvider),
	data: grpcSubscriptionProviderDataSchema,
});

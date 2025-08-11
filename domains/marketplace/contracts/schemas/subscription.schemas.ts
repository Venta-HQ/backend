import { z } from 'zod';

export const grpcSubscriptionProviderDataSchema = z.object({
	eventId: z.string(),
	productId: z.string(),
	transactionId: z.string(),
});

export const grpcSubscriptionCreateSchema = z.object({
	clerkUserId: z.string(),
	providerId: z.string(),
	data: grpcSubscriptionProviderDataSchema,
});

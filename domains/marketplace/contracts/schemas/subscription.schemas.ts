import { z } from 'zod';

const grpcSubscriptionProviderDataSchema = z.object({
	eventId: z.string(),
	productId: z.string(),
	transactionId: z.string(),
});

export const grpcSubscriptionCreateSchema = z.object({
	clerkUserId: z.string(),
	provider: z.number(),
	data: grpcSubscriptionProviderDataSchema,
});

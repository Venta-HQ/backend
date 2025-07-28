import { z } from 'zod';

// gRPC schemas for user service
export const GrpcUserVendorDataSchema = z.object({
	userId: z.string(),
});

export const GrpcClerkUserDataSchema = z.object({
	id: z.string(),
});

export const GrpcRevenueCatProviderDataSchema = z.object({
	transactionId: z.string(),
	eventId: z.string(),
	productId: z.string(),
});

export const GrpcRevenueCatSubscriptionDataSchema = z.object({
	clerkUserId: z.string(),
	providerId: z.string(),
	data: GrpcRevenueCatProviderDataSchema.optional(),
});

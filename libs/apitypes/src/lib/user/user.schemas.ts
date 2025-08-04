import { z } from 'zod';

// HTTP API schemas
export const CreateUserSchema = z.object({
	email: z.string().email(),
	name: z.string(),
});

export const UpdateUserSchema = z.object({
	email: z.string().email().optional(),
	name: z.string().optional(),
});

// gRPC schemas for user service
export const GrpcUserVendorDataSchema = z.object({
	userId: z.string(),
});

export const GrpcClerkUserDataSchema = z.object({
	id: z.string(),
});

export const GrpcRevenueCatProviderDataSchema = z.object({
	eventId: z.string(),
	productId: z.string(),
	transactionId: z.string(),
});

export const GrpcRevenueCatSubscriptionDataSchema = z.object({
	clerkUserId: z.string(),
	data: GrpcRevenueCatProviderDataSchema.optional(),
	providerId: z.string(),
});

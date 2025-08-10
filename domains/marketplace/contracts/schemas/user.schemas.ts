import { z } from 'zod';

/**
 * Zod schemas for User domain ACL validation
 */

// Base validation schemas
const nonEmptyStringSchema = z.string().min(1, 'Required field cannot be empty');

// User Identity Schemas
export const userIdentityGrpcSchema = z.object({
	id: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'User ID is required',
	}),
});

export const userIdentityDomainSchema = z.object({
	id: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'User ID is required',
	}),
});

// Subscription Create Schemas
export const subscriptionCreateGrpcSchema = z.object({
	clerkUserId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Clerk User ID is required',
	}),
	providerId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Provider ID is required',
	}),
	data: z
		.object({
			transactionId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
				message: 'Transaction ID is required',
			}),
			productId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
				message: 'Product ID is required',
			}),
			eventId: z.string(),
		})
		.optional()
		.transform((data) => {
			if (!data) {
				throw new Error('Subscription data is required');
			}
			return data;
		}),
});

export const subscriptionCreateDomainSchema = z.object({
	userId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'User ID is required',
	}),
	providerId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Provider ID is required',
	}),
	data: z.object({
		transactionId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
			message: 'Transaction ID is required',
		}),
		productId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
			message: 'Product ID is required',
		}),
		eventId: z.string(),
	}),
});

// User Vendor Query Schemas
export const userVendorQueryGrpcSchema = userIdentityGrpcSchema;

export const userVendorQueryDomainSchema = z.object({
	userId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'User ID is required',
	}),
});

// Type exports for TypeScript
export type UserIdentityGrpc = z.infer<typeof userIdentityGrpcSchema>;
export type UserIdentityDomain = z.infer<typeof userIdentityDomainSchema>;
export type SubscriptionCreateGrpc = z.infer<typeof subscriptionCreateGrpcSchema>;
export type SubscriptionCreateDomain = z.infer<typeof subscriptionCreateDomainSchema>;
export type UserVendorQueryGrpc = z.infer<typeof userVendorQueryGrpcSchema>;
export type UserVendorQueryDomain = z.infer<typeof userVendorQueryDomainSchema>;

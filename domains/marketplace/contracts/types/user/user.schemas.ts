import { z } from 'zod';

/**
 * Schema for user identity data
 */
export const GrpcUserIdentitySchema = z.object({
	id: z.string().uuid(),
});

/**
 * Schema for user vendor data
 */
export const GrpcUserVendorSchema = z.object({
	userId: z.string().uuid(),
});

/**
 * Schema for subscription data
 */
export const GrpcSubscriptionDataSchema = z.object({
	subscriptionId: z.string(),
	transactionId: z.string(),
	productId: z.string(),
	status: z.enum(['active', 'cancelled', 'expired']).optional(),
	expiresAt: z.string().datetime().optional(),
});

/**
 * Schema for subscription creation data
 */
export const GrpcSubscriptionCreateSchema = z.object({
	clerkUserId: z.string().uuid(),
	data: GrpcSubscriptionDataSchema,
	providerId: z.string(),
});

/**
 * Schema for Clerk user data
 */
export const ClerkUserSchema = z.object({
	id: z.string().uuid(),
	email_addresses: z.array(
		z.object({
			email_address: z.string().email(),
			verification: z
				.object({
					status: z.enum(['verified', 'unverified']),
				})
				.optional(),
		}),
	),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
});

/**
 * Schema for RevenueCat subscription data
 */
export const RevenueCatSubscriptionSchema = z.object({
	id: z.string(),
	user_id: z.string().uuid(),
	product_id: z.string(),
	transaction_id: z.string(),
	status: z.enum(['active', 'cancelled', 'expired']),
	period_type: z.enum(['normal', 'trial']),
	purchased_at: z.string().datetime(),
	expires_at: z.string().datetime().optional(),
});

import { z } from 'zod';

export const WebhookEventSchema = z.object({
	id: z.string(),
	type: z.string(),
	data: z.record(z.unknown()),
	timestamp: z.string().datetime(),
});

export const NotificationDataSchema = z.object({
	recipientId: z.string(),
	type: z.string(),
	message: z.string(),
	metadata: z.record(z.unknown()).optional(),
});

export const ClerkWebhookPayloadSchema = z.object({
	id: z.string(),
	object: z.literal('user'),
	type: z.enum(['user.created', 'user.updated', 'user.deleted']),
	data: z.object({
		id: z.string(),
		email_addresses: z.array(
			z.object({
				id: z.string(),
				email_address: z.string().email(),
				verification: z.object({
					status: z.enum(['verified', 'unverified']),
				}),
			}),
		),
		first_name: z.string().nullable(),
		last_name: z.string().nullable(),
		created_at: z.number(),
		updated_at: z.number(),
	}),
});

export const RevenueCatWebhookPayloadSchema = z.object({
	event: z.object({
		type: z.enum(['INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'EXPIRATION']),
		app_user_id: z.string(),
		product_id: z.string(),
		transaction_id: z.string(),
		original_transaction_id: z.string(),
		period_type: z.enum(['NORMAL', 'TRIAL', 'INTRO']),
		purchased_at_ms: z.number(),
		expiration_at_ms: z.number(),
	}),
});

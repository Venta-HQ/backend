import { z } from 'zod';

export interface RevenueCatWebhookPayload {
	event: {
		type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'EXPIRATION';
		app_user_id: string;
		product_id: string;
		transaction_id: string;
		original_transaction_id: string;
		period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
		purchased_at_ms: number;
		expiration_at_ms: number;
	};
}

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

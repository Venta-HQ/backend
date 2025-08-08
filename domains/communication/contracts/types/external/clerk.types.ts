import { z } from 'zod';

export interface ClerkWebhookPayload {
	id: string;
	object: 'user';
	type: 'user.created' | 'user.updated' | 'user.deleted';
	data: {
		id: string;
		email_addresses: Array<{
			id: string;
			email_address: string;
			verification: {
				status: 'verified' | 'unverified';
			};
		}>;
		first_name: string | null;
		last_name: string | null;
		created_at: number;
		updated_at: number;
	};
}

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

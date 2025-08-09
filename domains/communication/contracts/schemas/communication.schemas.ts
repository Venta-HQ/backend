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

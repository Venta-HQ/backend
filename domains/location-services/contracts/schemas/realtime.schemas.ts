import { z } from 'zod';

export const ClientConnectionSchema = z.object({
	id: z.string(),
	userId: z.string(),
	connectedAt: z.string().datetime(),
	subscriptions: z.array(z.string()),
	metadata: z.record(z.string()),
});

export const MessageMetadataSchema = z.object({
	id: z.string(),
	publisherId: z.string(),
	topic: z.string(),
	attempts: z.number().nonnegative().optional(),
});

export const MessageSchema = z.object({
	type: z.string(),
	payload: z.unknown(),
	timestamp: z.string().datetime(),
	metadata: MessageMetadataSchema.optional(),
});

export const SubscriptionOptionsSchema = z.object({
	topic: z.string(),
	queue: z.string().optional(),
	maxInFlight: z.number().positive().optional(),
	timeout: z.number().positive().optional(),
});

export const LocationUpdateSchema = z.object({
	entityId: z.string(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	timestamp: z.string().datetime(),
});

export const VendorStatusSchema = z.object({
	vendorId: z.string(),
	isOnline: z.boolean(),
	timestamp: z.string().datetime(),
});

export const SubscriptionRequestSchema = z.object({
	topic: z.string(),
	options: z
		.object({
			filter: z.string().optional(),
			rateLimit: z.number().positive().optional(),
		})
		.optional(),
});

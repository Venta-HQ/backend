import { z } from 'zod';

export const DomainEventMetaSchema = z.object({
	domain: z.string(),
	subdomain: z.string(),
	eventId: z.string(),
});

export const DomainEventSchema = z.object({
	data: z.unknown(),
	meta: DomainEventMetaSchema,
	context: z.record(z.unknown()).optional(),
});

export const SubscriptionOptionsSchema = z.object({
	topic: z.string(),
	queue: z.string().optional(),
	maxInFlight: z.number().positive().optional(),
	timeout: z.number().positive().optional(),
});

export const SearchRecordSchema = z.object({
	objectID: z.string(),
	name: z.string(),
	description: z.string().optional(),
	email: z.string().email().optional(),
	isOpen: z.boolean(),
	ownerId: z.string(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	_geoloc: z
		.object({
			lat: z.number().min(-90).max(90),
			long: z.number().min(-180).max(180),
		})
		.optional(),
});

export const SearchUpdateSchema = z.object({
	objectID: z.string(),
	updatedFields: z.array(z.string()),
	timestamp: z.string().datetime(),
});

export const LocationUpdateSchema = z.object({
	objectID: z.string(),
	_geoloc: z.object({
		lat: z.number().min(-90).max(90),
		long: z.number().min(-180).max(180),
	}),
	timestamp: z.string().datetime(),
});

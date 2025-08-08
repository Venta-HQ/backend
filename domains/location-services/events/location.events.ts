import { z } from 'zod';
import { createEventSchema, EnforceValidDomainEvents } from '@app/eventtypes';

// Location domain events with type enforcement
export const locationEventSchemas = {
	'location.vendor.location_updated': createEventSchema({
		vendorId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId']),

	'location.user.location_updated': createEventSchema({
		userId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['userId']),
} as const satisfies EnforceValidDomainEvents<'location'>;

// Type-safe event data map
export type LocationEventDataMap = {
	[K in keyof typeof locationEventSchemas]: z.infer<(typeof locationEventSchemas)[K]>;
};

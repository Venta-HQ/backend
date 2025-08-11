import { z } from 'zod';
import { createEventSchema, EnforceValidDomainEvents } from '../../shared';

// Location schema (standardized across domains)
const LocationSchema = z.object({
	lat: z.number(),
	lng: z.number(),
});

// Location domain events with type enforcement
export const locationEventSchemas = {
	'location.vendor.location_updated': createEventSchema({
		vendorId: z.string(),
		location: LocationSchema,
		timestamp: z
			.string()
			.datetime()
			.default(() => new Date().toISOString()),
	}).withContext(['vendorId']),
} as const satisfies EnforceValidDomainEvents<'location'>;

// Type-safe event data map
export type LocationEventDataMap = {
	[K in keyof typeof locationEventSchemas]: z.infer<(typeof locationEventSchemas)[K]>;
};

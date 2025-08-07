import { z } from 'zod';
import { createEventSchema } from '../../shared/base.types';
import { EnforceValidDomainEvents } from '../../shared/event-schema-types';

const baseLocationSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

// Type-safe location event schemas - TypeScript will error if you use invalid event names
export const locationEventSchemas: EnforceValidDomainEvents<'location'> = {
	'location.vendor_location_updated': createEventSchema({
		vendorId: z.string(),
		location: baseLocationSchema,
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId']),

	'location.user_location_updated': createEventSchema({
		userId: z.string(),
		location: baseLocationSchema,
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['userId']),
} as const;

// Type-safe event data map
export type LocationEventDataMap = {
	[K in keyof typeof locationEventSchemas]: z.infer<(typeof locationEventSchemas)[K]>;
};

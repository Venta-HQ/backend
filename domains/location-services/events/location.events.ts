import { z } from 'zod';
import { createEventSchema, EnforceValidDomainEvents } from '@venta/eventtypes';
import { LocationServices } from '../contracts/types/context-mapping.types';

// Location domain events with type enforcement
export const locationEventSchemas = {
	'location.vendor.location_updated': createEventSchema({
		vendorId: z.string(),
		location: LocationServices.Location.Validation.LocationSchema,
		timestamp: z
			.string()
			.datetime()
			.default(() => new Date().toISOString()),
	}).withContext(['vendorId']),

	'location.user.location_updated': createEventSchema({
		userId: z.string(),
		location: LocationServices.Location.Validation.LocationSchema,
		timestamp: z
			.string()
			.datetime()
			.default(() => new Date().toISOString()),
	}).withContext(['userId']),
} as const satisfies EnforceValidDomainEvents<'location'>;

// Type-safe event data map
export type LocationEventDataMap = {
	[K in keyof typeof locationEventSchemas]: z.infer<(typeof locationEventSchemas)[K]>;
};

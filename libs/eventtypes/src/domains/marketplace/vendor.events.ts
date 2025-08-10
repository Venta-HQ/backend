import { z } from 'zod';
import { createEventSchema, EnforceValidDomainEvents } from '../../shared';

// Location schema (simplified for cross-domain usage)
const LocationSchema = z.object({
	lat: z.number(),
	lng: z.number(),
});

// Vendor domain events with type enforcement
export const vendorEventSchemas = {
	'marketplace.vendor.onboarded': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		// location schema
		location: LocationSchema,
		timestamp: z
			.string()
			.datetime()
			.default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']),

	'marketplace.vendor.profile_updated': createEventSchema({
		vendorId: z.string(),
		updatedFields: z.array(z.string()),
		timestamp: z
			.string()
			.datetime()
			.default(() => new Date().toISOString()),
	}).withContext(['vendorId']),

	'marketplace.vendor.deactivated': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		timestamp: z
			.string()
			.datetime()
			.default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']),
} as const satisfies EnforceValidDomainEvents<'marketplace'>;

// Type-safe event data map
export type VendorEventDataMap = {
	[K in keyof typeof vendorEventSchemas]: z.infer<(typeof vendorEventSchemas)[K]>;
};

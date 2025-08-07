import { z } from 'zod';
import { createEventSchema } from '../../../shared/base.types';
import { EnforceValidDomainEvents } from '../../../shared/event-schema-types';

// Vendor domain events with type enforcement
export const vendorEventSchemas = {
	'marketplace.vendor.onboarded': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']),

	'marketplace.vendor.profile_updated': createEventSchema({
		vendorId: z.string(),
		updatedFields: z.array(z.string()),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId']),

	'marketplace.vendor.deactivated': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']),
} as const satisfies EnforceValidDomainEvents<'marketplace'>;

// Type-safe event data map
export type VendorEventDataMap = {
	[K in keyof typeof vendorEventSchemas]: z.infer<(typeof vendorEventSchemas)[K]>;
};

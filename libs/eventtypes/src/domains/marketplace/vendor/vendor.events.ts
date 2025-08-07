import { z } from 'zod';
import { createEventSchema } from '../../../shared/base.types';
import { EnforceValidDomainEvents } from '../../../shared/event-schema-types';

// Type-safe event schemas - TypeScript will error if you use invalid event names
export const vendorEventSchemas: EnforceValidDomainEvents<'marketplace'> = {
	'marketplace.vendor_onboarded': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']),

	'marketplace.vendor_profile_updated': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		updatedFields: z.array(z.string()),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']),

	'marketplace.vendor_deactivated': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']),
} as const;

// Type-safe event data map
export type VendorEventDataMap = {
	[K in keyof typeof vendorEventSchemas]: z.infer<(typeof vendorEventSchemas)[K]>;
};

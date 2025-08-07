import { z } from 'zod';

/**
 * Vendor event data schema
 * Matches the Prisma Vendor model structure (without relations)
 */
export const vendorEventDataSchema = z.object({
	createdAt: z.date().optional(),
	description: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	id: z.string(),
	lat: z.number().nullable().optional(),
	long: z.number().nullable().optional(),
	name: z.string().optional(),
	open: z.boolean().optional(),
	phone: z.string().nullable().optional(),
	primaryImage: z.string().nullable().optional(),
	updatedAt: z.date().optional(),
	website: z.string().nullable().optional(),
	// Note: owner relation is excluded from events for security/privacy
});

// Derive type from schema but ensure id is required
export type VendorEventData = z.infer<typeof vendorEventDataSchema> &
	Required<Pick<z.infer<typeof vendorEventDataSchema>, 'id'>>;

/**
 * Vendor location update event schema
 * Used when vendor location is updated via location service
 */
export const vendorLocationUpdateEventDataSchema = z.object({
	vendorId: z.string(),
	location: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	timestamp: z.date(),
});

export type VendorLocationUpdateEventData = z.infer<typeof vendorLocationUpdateEventDataSchema>;

export const vendorEventSchemas = {
	'vendor.created': vendorEventDataSchema,
	'vendor.deleted': vendorEventDataSchema,
	'vendor.updated': vendorEventDataSchema,
	'vendor.location.updated': vendorLocationUpdateEventDataSchema,
} as const;

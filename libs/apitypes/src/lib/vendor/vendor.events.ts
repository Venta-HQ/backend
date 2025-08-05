import { z } from 'zod';

/**
 * Vendor event data schema
 * Matches the Prisma Vendor model structure (without relations)
 */
export const vendorEventDataSchema = z
	.object({
		createdAt: z.date(),
		description: z.string().nullable(),
		email: z.string().nullable(),
		id: z.string(),
		lat: z.number().nullable(),
		long: z.number().nullable(),
		name: z.string(),
		open: z.boolean(),
		phone: z.string().nullable(),
		primaryImage: z.string().nullable(),
		updatedAt: z.date(),
		website: z.string().nullable(),
		// Note: owner relation is excluded from events for security/privacy
	})
	.passthrough(); // Allow additional fields (like owner) to pass through

/**
 * Vendor event schemas object
 * Maps subject names to their corresponding schemas
 */
/**
 * Vendor location update event data schema
 */
export const vendorLocationEventDataSchema = z.object({
	location: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	timestamp: z.date(),
	vendorId: z.string(),
});

export const vendorEventSchemas = {
	'vendor.created': vendorEventDataSchema,
	'vendor.deleted': vendorEventDataSchema,
	'vendor.location.updated': vendorLocationEventDataSchema,
	'vendor.updated': vendorEventDataSchema,
} as const;

import { z } from 'zod';

/**
 * Zod schemas for Vendor domain ACL validation
 */

// Base validation schemas
const nonEmptyStringSchema = z.string().min(1, 'Required field cannot be empty');
const emailSchema = z.string().email('Valid email address is required');
const optionalEmailSchema = z.string().email('Valid email address is required').optional();

// Coordinate schemas
const coordinateSchema = z
	.object({
		lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
		lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
	})
	.strict();

// Vendor Lookup Schemas
export const vendorLookupGrpcSchema = z.object({
	id: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Vendor ID is required',
	}),
});

export const vendorLookupDomainSchema = z.object({
	vendorId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Vendor ID is required',
	}),
});

// Vendor Create Schemas
export const vendorCreateGrpcSchema = z.object({
	name: nonEmptyStringSchema.refine((name) => name.trim().length > 0, {
		message: 'Vendor name is required',
	}),
	email: emailSchema,
	description: z.string(),
	phone: z.string(),
	website: z.string(),
	profileImage: z.string(),
});

export const vendorCreateDomainSchema = z.object({
	name: nonEmptyStringSchema.refine((name) => name.trim().length > 0, {
		message: 'Vendor name is required',
	}),
	email: emailSchema,
	description: z.string(),
	phone: z.string(),
	website: z.string(),
	imageUrl: z.string(),
});

// Vendor Update Schemas
export const vendorUpdateGrpcSchema = z.object({
	id: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Vendor ID is required',
	}),
	name: nonEmptyStringSchema.refine((name) => name.trim().length > 0, {
		message: 'Vendor name is required',
	}),
	email: z.string(),
	description: z.string(),
	phone: z.string(),
	website: z.string(),
	imageUrl: z.string(),
});

export const vendorUpdateDomainSchema = z.object({
	id: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Vendor ID is required',
	}),
	name: nonEmptyStringSchema.refine((name) => name.trim().length > 0, {
		message: 'Vendor name is required',
	}),
	email: z.string(),
	description: z.string(),
	phone: z.string(),
	website: z.string(),
	imageUrl: z.string(),
});

// Vendor Location Update Schemas
export const vendorLocationUpdateGrpcSchema = z.object({
	vendorId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Vendor ID is required',
	}),
	coordinates: coordinateSchema.optional().transform((coords) => {
		if (!coords) {
			throw new Error('Valid coordinates are required');
		}
		return coords;
	}),
});

export const vendorLocationChangeDomainSchema = z.object({
	vendorId: nonEmptyStringSchema.refine((id) => id.trim().length > 0, {
		message: 'Vendor ID is required',
	}),
	coordinates: coordinateSchema,
});

// Vendor Geospatial Query Schemas
export const vendorLocationRequestGrpcSchema = z.object({
	ne: coordinateSchema.optional().transform((coords) => {
		if (!coords) {
			throw new Error('Northeast coordinates are required');
		}
		return coords;
	}),
	sw: coordinateSchema.optional().transform((coords) => {
		if (!coords) {
			throw new Error('Southwest coordinates are required');
		}
		return coords;
	}),
});

export const vendorLocationQueryDomainSchema = z.object({
	ne: coordinateSchema,
	sw: coordinateSchema,
});

// Type exports for TypeScript
export type VendorLookupGrpc = z.infer<typeof vendorLookupGrpcSchema>;
export type VendorLookupDomain = z.infer<typeof vendorLookupDomainSchema>;
export type VendorCreateGrpc = z.infer<typeof vendorCreateGrpcSchema>;
export type VendorCreateDomain = z.infer<typeof vendorCreateDomainSchema>;
export type VendorUpdateGrpc = z.infer<typeof vendorUpdateGrpcSchema>;
export type VendorUpdateDomain = z.infer<typeof vendorUpdateDomainSchema>;
export type VendorLocationUpdateGrpc = z.infer<typeof vendorLocationUpdateGrpcSchema>;
export type VendorLocationChangeDomain = z.infer<typeof vendorLocationChangeDomainSchema>;
export type VendorLocationRequestGrpc = z.infer<typeof vendorLocationRequestGrpcSchema>;
export type VendorLocationQueryDomain = z.infer<typeof vendorLocationQueryDomainSchema>;

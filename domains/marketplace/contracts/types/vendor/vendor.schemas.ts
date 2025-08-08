import { z } from 'zod';

/**
 * Schema for gRPC vendor lookup data
 */
export const GrpcVendorLookupDataSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Schema for gRPC vendor create data
 */
export const GrpcVendorCreateDataSchema = z.object({
	userId: z.string().uuid(),
	name: z.string().min(1),
	description: z.string(),
	email: z.string().email(),
	phone: z.string().optional(),
	website: z.string().url().optional(),
	imageUrl: z.string().url().optional(),
});

/**
 * Schema for gRPC vendor update data
 */
export const GrpcVendorUpdateDataSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	name: z.string().min(1),
	description: z.string(),
	email: z.string().email(),
	phone: z.string().optional(),
	website: z.string().url().optional(),
	imageUrl: z.string().url().optional(),
});

/**
 * Schema for gRPC vendor location data
 */
export const GrpcVendorLocationDataSchema = z.object({
	vendorId: z.string().uuid(),
	location: z.object({
		lat: z.number().min(-90).max(90),
		long: z.number().min(-180).max(180),
	}),
});

/**
 * Schema for gRPC geospatial bounds
 */
export const GrpcGeospatialBoundsSchema = z.object({
	neLocation: z.object({
		lat: z.number().min(-90).max(90),
		long: z.number().min(-180).max(180),
	}),
	swLocation: z.object({
		lat: z.number().min(-90).max(90),
		long: z.number().min(-180).max(180),
	}),
});

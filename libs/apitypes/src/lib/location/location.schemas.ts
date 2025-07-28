import { z } from 'zod';

export const VendorLocationUpdateDataSchema = z.object({
	lat: z.number(),
	long: z.number(),
	vendorId: z.string(),
});

export const UpdateUserLocationDataSchema = z.object({
	neLocation: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	swLocation: z.object({
		lat: z.number(),
		long: z.number(),
	}),
	userId: z.string().optional(),
});

// gRPC schemas for location service
export const GrpcLocationSchema = z.object({
	lat: z.number(),
	long: z.number(),
});

export const GrpcLocationUpdateSchema = z.object({
	entityId: z.string(),
	location: GrpcLocationSchema.optional(),
});

export const GrpcVendorLocationRequestSchema = z.object({
	neLocation: GrpcLocationSchema.optional(),
	swLocation: GrpcLocationSchema.optional(),
});

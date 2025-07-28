import { z } from 'zod';

export const VendorLocationUpdateDataSchema = z.object({
	lat: z.number(),
	long: z.number(),
	vendorId: z.string(),
});

// gRPC schemas for location service
export const GrpcLocationSchema = z.object({
	long: z.number(),
	lat: z.number(),
});

export const GrpcLocationUpdateSchema = z.object({
	location: GrpcLocationSchema.optional(),
	entityId: z.string(),
});

export const GrpcVendorLocationRequestSchema = z.object({
	swLocation: GrpcLocationSchema.optional(),
	neLocation: GrpcLocationSchema.optional(),
});

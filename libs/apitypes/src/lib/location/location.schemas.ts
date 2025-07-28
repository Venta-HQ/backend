import { z } from 'zod';

export const VendorLocationUpdateDataSchema = z.object({
	lat: z.number(),
	long: z.number(),
	vendorId: z.string(),
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

import { z } from 'zod';

// Generic location data schema
export const LocationDataSchema = z.object({
	lat: z.number(),
	long: z.number(),
});

// Generic location update data schema
export const LocationUpdateDataSchema = z.object({
	entityId: z.string(),
	location: LocationDataSchema,
});

export const VendorLocationUpdateDataSchema = z.object({
	lat: z.number(),
	long: z.number(),
	vendorId: z.string(),
});

// Type export for VendorLocationUpdateData
export type VendorLocationUpdateData = z.infer<typeof VendorLocationUpdateDataSchema>;

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

// Type export for UpdateUserLocationData
export type UpdateUserLocationData = z.infer<typeof UpdateUserLocationDataSchema>;

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

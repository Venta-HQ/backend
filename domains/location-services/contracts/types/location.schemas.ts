import { z } from 'zod';

// Generic location data schema
export const LocationDataSchema = z.object({
	lat: z.number().min(-90).max(90),
	long: z.number().min(-180).max(180),
});

// Generic location update data schema
export const LocationUpdateDataSchema = z.object({
	entityId: z.string(),
	coordinates: LocationDataSchema,
});

export const VendorLocationUpdateDataSchema = z.object({
	lat: z.number().min(-90).max(90),
	long: z.number().min(-180).max(180),
	vendorId: z.string(),
});

// Type export for VendorLocationUpdateData
export type VendorLocationUpdateData = z.infer<typeof VendorLocationUpdateDataSchema>;

export const UpdateUserLocationDataSchema = z.object({
	neLocation: z.object({
		lat: z.number().min(-90).max(90),
		long: z.number().min(-180).max(180),
	}),
	swLocation: z.object({
		lat: z.number().min(-90).max(90),
		long: z.number().min(-180).max(180),
	}),
	userId: z.string().optional(),
});

// Type export for UpdateUserLocationData
export type UpdateUserLocationData = z.infer<typeof UpdateUserLocationDataSchema>;

// gRPC schemas for location service
export const GrpcLocationSchema = z.object({
	lat: z.number().min(-90).max(90),
	long: z.number().min(-180).max(180),
});

export const GrpcLocationUpdateSchema = z.object({
	entityId: z.string(),
	coordinates: GrpcLocationSchema,
});

export const GrpcVendorLocationRequestSchema = z.object({
	bounds: z.object({
		ne: GrpcLocationSchema,
		sw: GrpcLocationSchema,
	}),
});

// Redis geospatial schemas
export const GeoMemberSchema = z.object({
	key: z.string(),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
});

export const GeospatialQuerySchema = z.object({
	lat: z.number().min(-90).max(90),
	long: z.number().min(-180).max(180),
	radius: z.number().optional(),
});

// Vendor location request schema
export const VendorLocationRequestSchema = z.object({
	bounds: z.object({
		ne: z.object({
			lat: z.number().min(-90).max(90),
			long: z.number().min(-180).max(180),
		}),
		sw: z.object({
			lat: z.number().min(-90).max(90),
			long: z.number().min(-180).max(180),
		}),
	}),
});

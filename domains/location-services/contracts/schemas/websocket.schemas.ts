import { z } from 'zod';

/**
 * WebSocket message schemas for location services
 * These schemas are used with SchemaValidatorPipe to validate incoming WebSocket messages
 */

// User location update schema - supports both lat/lng and latitude/longitude
export const userLocationUpdateSchema = z
	.object({
		lat: z.number().min(-90).max(90).optional(),
		lng: z.number().min(-180).max(180).optional(),
		latitude: z.number().min(-90).max(90).optional(),
		longitude: z.number().min(-180).max(180).optional(),
	})
	.refine(
		(data) =>
			(data.lat !== undefined && data.lng !== undefined) ||
			(data.latitude !== undefined && data.longitude !== undefined),
		{
			message: 'Either (lat, lng) or (latitude, longitude) coordinates must be provided',
		},
	);

// Vendor location update schema
export const vendorLocationUpdateSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

// Type exports
export type UserLocationUpdateRequest = z.infer<typeof userLocationUpdateSchema>;
export type VendorLocationUpdateRequest = z.infer<typeof vendorLocationUpdateSchema>;

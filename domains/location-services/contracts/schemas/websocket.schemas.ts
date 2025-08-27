import { z } from 'zod';

/**
 * WebSocket message schemas for location services
 * These schemas are used with SchemaValidatorPipe to validate incoming WebSocket messages
 */

// User location update schema - requires lat/lng only
export const userLocationUpdateSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

// Vendor location update schema
export const vendorLocationUpdateSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

// Type exports
export type UserLocationUpdateRequest = z.infer<typeof userLocationUpdateSchema>;
export type VendorLocationUpdateRequest = z.infer<typeof vendorLocationUpdateSchema>;

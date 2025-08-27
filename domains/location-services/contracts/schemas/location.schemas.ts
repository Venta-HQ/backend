import { z } from 'zod';

/**
 * gRPC schemas for location services
 * These schemas validate gRPC data at the service boundaries
 */

// Coordinates schema
const coordinatesSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

// Location update schema for gRPC
export const grpcLocationUpdateSchema = z.object({
	entityId: z.string(),
	coordinates: coordinatesSchema,
});

// Geospatial query schema for gRPC
export const grpcGeospatialQuerySchema = z.object({
	ne: coordinatesSchema,
	sw: coordinatesSchema,
});

// Location result schema for gRPC responses
export const grpcLocationResultSchema = z.object({
	entityId: z.string(),
	entityType: z.enum(['user', 'vendor']),
	coordinates: coordinatesSchema,
	distance: z.number().optional(),
	lastUpdated: z.string(),
});

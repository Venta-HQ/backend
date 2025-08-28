import { z } from 'zod';
import { coordinatesSchema } from './common.schemas';

/**
 * gRPC schemas for location services
 * These schemas validate gRPC data at the service boundaries
 */

// Coordinates schema (shared)

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

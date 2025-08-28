import { z } from 'zod';
import { coordinatesSchema } from './common.schemas';

/**
 * WebSocket message schemas for location services
 * These schemas are used with SchemaValidatorPipe to validate incoming WebSocket messages
 */

// Base coordinates schema used by both user and vendor update messages
export const locationCoordinatesSchema = coordinatesSchema;

// Backward-compatible aliases for clearer intent at call sites
export const userLocationUpdateSchema = locationCoordinatesSchema;
export const vendorLocationUpdateSchema = locationCoordinatesSchema;

// Type exports
export type LocationCoordinatesRequest = z.infer<typeof locationCoordinatesSchema>;
export type UserLocationUpdateRequest = LocationCoordinatesRequest;
export type VendorLocationUpdateRequest = LocationCoordinatesRequest;

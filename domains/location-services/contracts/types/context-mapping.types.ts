/**
 * Location Services Domain Types
 *
 * These types define the core concepts and contracts for the location services domain.
 * The domain is responsible for handling geospatial data, location tracking,
 * and real-time location updates.
 */

import { z } from 'zod';

export namespace LocationServices {
	// ============================================================================
	// Core Domain Types
	// Primary types that represent our domain concepts
	// ============================================================================
	export namespace Core {
		/**
		 * Geographic coordinates
		 */
		export interface Coordinates {
			/** Latitude (-90 to 90) */
			lat: number;
			/** Longitude (-180 to 180) */
			lng: number;
		}

		/**
		 * Vendor location data
		 */
		export interface VendorLocation {
			/** Vendor ID */
			entityId: string;
			/** Current coordinates */
			coordinates: Coordinates;
			/** Last update timestamp */
			updatedAt: string;
			/** Operating status */
			isActive: boolean;
		}

		/**
		 * Geospatial search bounds
		 */
		export interface GeospatialBounds {
			/** Southwest corner */
			sw: Coordinates;
			/** Northeast corner */
			ne: Coordinates;
		}

		/**
		 * Location update metadata
		 */
		export interface LocationUpdateMetadata {
			/** Update source */
			source: 'vendor' | 'system' | 'manual';
			/** Update reason */
			reason?: string;
			/** Update timestamp */
			timestamp?: string;
			/** Additional context */
			context?: Record<string, string>;
		}
	}

	// ============================================================================
	// Contract Types
	// Types that other domains use when interacting with Location Services
	// ============================================================================
	export namespace Contracts {
		/**
		 * Location update request
		 */
		export interface LocationUpdate {
			/** Entity ID (vendor/user) */
			entityId: string;
			/** New coordinates */
			coordinates: Core.Coordinates;
			/** Update metadata */
			metadata?: Core.LocationUpdateMetadata;
		}

		/**
		 * Geospatial query request
		 */
		export interface GeospatialQuery {
			/** Search bounds */
			bounds: Core.GeospatialBounds;
			/** Maximum results */
			limit?: number;
			/** Filter active only */
			activeOnly?: boolean;
		}

		/**
		 * Location update response
		 */
		export interface LocationUpdateResult {
			/** Entity ID */
			entityId: string;
			/** Update success */
			success: boolean;
			/** Update timestamp */
			timestamp: string;
			/** Error message if failed */
			error?: string;
		}
	}

	// ============================================================================
	// Internal Types
	// Types used within the Location Services domain
	// ============================================================================
	export namespace Internal {
		/**
		 * Redis geospatial member
		 */
		export interface GeoMember {
			/** Entity key */
			key: string;
			/** Latitude */
			latitude: number;
			/** Longitude */
			longitude: number;
			/** Distance from query point (if applicable) */
			distance?: number;
		}

		/**
		 * Redis geospatial query options
		 */
		export interface GeoQueryOptions {
			/** Result count limit */
			count?: number;
			/** Sort by distance */
			sort?: 'ASC' | 'DESC';
			/** Include distances in results */
			withDistances?: boolean;
		}

		/**
		 * Location tracking configuration
		 */
		export interface TrackingConfig {
			/** Update frequency in seconds */
			updateFrequency: number;
			/** Maximum update age in seconds */
			maxAge: number;
			/** Whether to track history */
			trackHistory: boolean;
		}
	}

	// ============================================================================
	// Event Types
	// Types for domain events
	// ============================================================================
	export namespace Events {
		/**
		 * Location updated event
		 */
		export interface LocationUpdated {
			/** Entity ID */
			entityId: string;
			/** New coordinates */
			coordinates: Core.Coordinates;
			/** Update timestamp */
			timestamp: string;
			/** Update metadata */
			metadata?: Core.LocationUpdateMetadata;
		}

		/**
		 * Entity entered area event
		 */
		export interface EntityEnteredArea {
			/** Entity ID */
			entityId: string;
			/** Area bounds */
			bounds: Core.GeospatialBounds;
			/** Entry timestamp */
			timestamp: string;
		}

		/**
		 * Entity left area event
		 */
		export interface EntityLeftArea {
			/** Entity ID */
			entityId: string;
			/** Area bounds */
			bounds: Core.GeospatialBounds;
			/** Exit timestamp */
			timestamp: string;
		}
	}

	// ============================================================================
	// Validation Schemas
	// Zod schemas for validating domain types
	// ============================================================================
	export namespace Validation {
		export const CoordinatesSchema = z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		});

		export const GeospatialBoundsSchema = z.object({
			sw: CoordinatesSchema,
			ne: CoordinatesSchema,
		});

		export const LocationUpdateSchema = z.object({
			entityId: z.string(),
			coordinates: CoordinatesSchema,
			metadata: z
				.object({
					source: z.enum(['vendor', 'system', 'manual']),
					reason: z.string().optional(),
					timestamp: z.string().datetime().optional(),
					context: z.record(z.string()).optional(),
				})
				.optional(),
		});

		export const GeospatialQuerySchema = z.object({
			bounds: GeospatialBoundsSchema,
			limit: z.number().positive().optional(),
			activeOnly: z.boolean().optional(),
		});

		export const GeoMemberSchema = z.object({
			key: z.string().min(1),
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180),
			distance: z.number().nonnegative().optional(),
		});
	}
}

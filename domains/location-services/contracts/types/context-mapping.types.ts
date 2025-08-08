/**
 * Location Services Domain Context Mapping Types
 *
 * These types define the context mapping interfaces for the location services domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Location Services Domain Types
// ============================================================================

export namespace LocationServices {
	/**
	 * Location bounds for geospatial queries
	 */
	export interface Bounds {
		/** Southwest corner coordinates */
		swLocation: {
			lat: number;
			lng: number;
		};
		/** Northeast corner coordinates */
		neLocation: {
			lat: number;
			lng: number;
		};
	}

	/**
	 * Vendor location data in location services context
	 */
	export interface VendorLocation {
		/** Vendor ID from marketplace context */
		vendorId: string;
		/** Location coordinates */
		location: Coordinates;
		/** Distance from query point (in meters) */
		distance?: number;
		/** Last update timestamp */
		lastUpdated: string;
		/** Location tracking status */
		trackingStatus: TrackingStatus;
	}

	/**
	 * User location data in location services context
	 */
	export interface UserLocation {
		/** User ID from marketplace context */
		userId: string;
		/** Location coordinates */
		location: Coordinates;
		/** Last update timestamp */
		lastUpdated: string;
		/** Location tracking status */
		trackingStatus: TrackingStatus;
	}

	/**
	 * Location update event in location services context
	 */
	export interface LocationUpdate {
		/** Entity ID (vendor or user) */
		entityId: string;
		/** Entity type */
		entityType: EntityType;
		/** New location coordinates */
		location: Coordinates;
		/** Update timestamp */
		timestamp: string;
		/** Update source */
		source: LocationSource;
		/** Accuracy in meters */
		accuracy?: number;
	}

	/**
	 * Geospatial query result
	 */
	export interface GeospatialQueryResult {
		/** Query bounds */
		bounds: Bounds;
		/** Found entities */
		entities: Array<{
			id: string;
			type: EntityType;
			location: Coordinates;
			distance?: number;
		}>;
		/** Query timestamp */
		timestamp: string;
	}

	/**
	 * Common location coordinates type
	 */
	export interface Coordinates {
		lat: number;
		lng: number;
	}

	/**
	 * Entity types that can be tracked
	 */
	export type EntityType = 'vendor' | 'user';

	/**
	 * Location tracking status
	 */
	export type TrackingStatus = 'active' | 'inactive' | 'suspended';

	/**
	 * Location update source
	 */
	export type LocationSource = 'gps' | 'manual' | 'estimated';
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Validation schema for location coordinates
 */
const LocationCoordinatesSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

/**
 * Validation schema for location-marketplace mapping
 */
export const LocationMarketplaceMappingSchema = z.object({
	vendorLocation: z.object({
		locationVendorId: z.string(),
		marketplaceVendorId: z.string(),
		locationCoordinates: LocationCoordinatesSchema,
		locationDomain: z.literal('vendor_location'),
		timestamp: z.string(),
	}),
	userLocation: z.object({
		locationUserId: z.string(),
		marketplaceUserId: z.string(),
		locationCoordinates: LocationCoordinatesSchema,
		locationDomain: z.literal('user_location'),
		timestamp: z.string(),
	}),
});

/**
 * Location Services Domain Context Mapping Types
 *
 * These types define the context mapping interfaces for the location services domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Location Services Core Types
// ============================================================================

/**
 * Location bounds for geospatial queries
 */
export interface LocationServicesBounds {
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
export interface VendorLocationData {
	/** Vendor ID from marketplace context */
	vendorId: string;
	/** Location coordinates */
	location: {
		lat: number;
		lng: number;
	};
	/** Distance from query point (in meters) */
	distance?: number;
	/** Last update timestamp */
	lastUpdated: string;
	/** Location tracking status */
	trackingStatus: 'active' | 'inactive' | 'suspended';
}

/**
 * User location data in location services context
 */
export interface UserLocationData {
	/** User ID from marketplace context */
	userId: string;
	/** Location coordinates */
	location: {
		lat: number;
		lng: number;
	};
	/** Last update timestamp */
	lastUpdated: string;
	/** Location tracking status */
	trackingStatus: 'active' | 'inactive' | 'suspended';
}

/**
 * Location update event in location services context
 */
export interface LocationUpdateEvent {
	/** Entity ID (vendor or user) */
	entityId: string;
	/** Entity type */
	entityType: 'vendor' | 'user';
	/** New location coordinates */
	location: {
		lat: number;
		lng: number;
	};
	/** Update timestamp */
	timestamp: string;
	/** Update source */
	source: 'gps' | 'manual' | 'estimated';
	/** Accuracy in meters */
	accuracy?: number;
}

/**
 * Geospatial query result
 */
export interface GeospatialQueryResult {
	/** Query bounds */
	bounds: LocationServicesBounds;
	/** Found entities */
	entities: Array<{
		id: string;
		type: 'vendor' | 'user';
		location: {
			lat: number;
			lng: number;
		};
		distance?: number;
	}>;
	/** Query timestamp */
	timestamp: string;
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

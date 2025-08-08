/**
 * Location Services Domain Context Mapping Types
 * 
 * These types define the context mapping interfaces for the location services domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Location Services ↔ Marketplace Context Mapping
// ============================================================================

/**
 * Maps location services concepts to marketplace domain
 */
export interface LocationMarketplaceMapping {
	/**
	 * Vendor location mapping from location to marketplace context
	 */
	vendorLocation: {
		/** Location domain vendor ID */
		locationVendorId: string;
		/** Marketplace vendor ID reference */
		marketplaceVendorId: string;
		/** Location coordinates */
		locationCoordinates: {
			lat: number;
			lng: number;
		};
		/** Location domain identifier */
		locationDomain: 'vendor_location';
		/** Timestamp of the mapping */
		timestamp: string;
	};

	/**
	 * User location mapping from location to marketplace context
	 */
	userLocation: {
		/** Location domain user ID */
		locationUserId: string;
		/** Marketplace user ID reference */
		marketplaceUserId: string;
		/** Location coordinates */
		locationCoordinates: {
			lat: number;
			lng: number;
		};
		/** Location domain identifier */
		locationDomain: 'user_location';
		/** Timestamp of the mapping */
		timestamp: string;
	};
}

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
// Location Services ↔ Infrastructure Context Mapping
// ============================================================================

/**
 * Maps location services concepts to infrastructure domain
 */
export interface LocationInfrastructureMapping {
	/**
	 * Location data storage mapping
	 */
	locationStorage: {
		/** Location domain identifier */
		domain: 'location';
		/** Storage type */
		storageType: 'redis' | 'database' | 'cache';
		/** Entity type */
		entityType: 'vendor' | 'user';
		/** Entity ID */
		entityId: string;
		/** Storage timestamp */
		timestamp: string;
	};

	/**
	 * Location analytics mapping
	 */
	locationAnalytics: {
		/** Location domain identifier */
		domain: 'location';
		/** Analytics event type */
		eventType: 'location_update' | 'geospatial_query' | 'proximity_alert';
		/** Event data */
		eventData: Record<string, any>;
		/** Event timestamp */
		timestamp: string;
	};
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Validation schema for location-marketplace mapping
 */
export const LocationMarketplaceMappingSchema = z.object({
	vendorLocation: z.object({
		locationVendorId: z.string(),
		marketplaceVendorId: z.string(),
		locationCoordinates: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		locationDomain: z.literal('vendor_location'),
		timestamp: z.string(),
	}),
	userLocation: z.object({
		locationUserId: z.string(),
		marketplaceUserId: z.string(),
		locationCoordinates: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		locationDomain: z.literal('user_location'),
		timestamp: z.string(),
	}),
});

/**
 * Validation schema for location-infrastructure mapping
 */
export const LocationInfrastructureMappingSchema = z.object({
	locationStorage: z.object({
		domain: z.literal('location'),
		storageType: z.enum(['redis', 'database', 'cache']),
		entityType: z.enum(['vendor', 'user']),
		entityId: z.string(),
		timestamp: z.string(),
	}),
	locationAnalytics: z.object({
		domain: z.literal('location'),
		eventType: z.enum(['location_update', 'geospatial_query', 'proximity_alert']),
		eventData: z.record(z.any()),
		timestamp: z.string(),
	}),
}); 
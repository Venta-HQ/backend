/**
 * Marketplace Domain Context Mapping Types
 *
 * These types define the context mapping interfaces for the marketplace domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Marketplace Domain Types
// ============================================================================

export namespace Marketplace {
	/**
	 * Location bounds for geospatial queries
	 */
	export interface LocationBounds {
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
	 * Vendor location data returned from location services
	 */
	export interface VendorLocation {
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
	}

	/**
	 * User location data returned from location services
	 */
	export interface UserLocation {
		/** User ID from marketplace context */
		userId: string;
		/** Location coordinates */
		location: {
			lat: number;
			lng: number;
		};
		/** Last update timestamp */
		lastUpdated: string;
	}

	/**
	 * Location update event
	 */
	export interface LocationUpdate {
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
	}

	/**
	 * External user data from communication context
	 */
	export interface ExternalUserData {
		/** External service user ID */
		externalUserId: string;
		/** External service name */
		service: 'clerk' | 'revenuecat';
		/** User data from external service */
		data: ExternalUserDataMap[keyof ExternalUserDataMap];
		/** Event timestamp */
		timestamp: string;
	}

	/**
	 * Type-safe external user data map
	 */
	export interface ExternalUserDataMap {
		clerk: {
			email: string;
			firstName?: string;
			lastName?: string;
			metadata?: Record<string, string>;
		};
		revenuecat: {
			originalAppUserId: string;
			subscriptionStatus?: string;
		};
	}

	/**
	 * External subscription data from communication context
	 */
	export interface ExternalSubscriptionData {
		/** External service subscription ID */
		externalSubscriptionId: string;
		/** External service name */
		service: 'revenuecat';
		/** Subscription data from external service */
		data: {
			productId: string;
			transactionId: string;
			status: string;
		};
		/** Event timestamp */
		timestamp: string;
	}

	/**
	 * External user mapping for identity resolution
	 */
	export interface ExternalUserMapping {
		/** Internal marketplace user ID */
		marketplaceUserId: string;
		/** External service mappings */
		externalMappings: {
			clerk?: string;
			revenuecat?: string;
		};
		/** Mapping creation timestamp */
		createdAt: string;
		/** Mapping last updated timestamp */
		updatedAt: string;
	}
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
 * Validation schema for marketplace-location mapping
 */
export const MarketplaceLocationMappingSchema = z.object({
	vendorLocation: z.object({
		marketplaceVendorId: z.string(),
		locationCoordinates: LocationCoordinatesSchema,
		locationDomain: z.literal('vendor_location'),
		timestamp: z.string(),
	}),
	userLocation: z.object({
		marketplaceUserId: z.string(),
		locationCoordinates: LocationCoordinatesSchema,
		locationDomain: z.literal('user_location'),
		timestamp: z.string(),
	}),
});

/**
 * Validation schema for marketplace-communication mapping
 */
export const MarketplaceCommunicationMappingSchema = z.object({
	userIdentity: z.object({
		marketplaceUserId: z.string(),
		externalServiceIds: z.object({
			clerk: z.string(),
			revenuecat: z.string().optional(),
		}),
		timestamp: z.string(),
	}),
	subscription: z.object({
		marketplaceSubscriptionId: z.string(),
		revenuecatSubscriptionId: z.string(),
		status: z.enum(['active', 'cancelled', 'expired']),
		timestamp: z.string(),
	}),
});

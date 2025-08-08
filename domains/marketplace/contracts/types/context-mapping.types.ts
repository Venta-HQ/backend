/**
 * Marketplace Domain Types
 *
 * These types define the core concepts and contracts for the marketplace domain.
 * The domain is responsible for managing users, vendors, and their interactions.
 */

import { z } from 'zod';

export namespace Marketplace {
	// ============================================================================
	// Core Domain Types
	// Primary types that represent our domain concepts
	// ============================================================================
	export namespace Core {
		export interface UserSubscription {
			id: string;
			userId: string;
			status: 'active' | 'cancelled' | 'expired';
			provider: 'revenuecat';
			externalId: string;
			productId: string;
			startDate: string;
			endDate?: string;
		}

		export interface UserVendorRequest {
			userId: string;
		}

		export interface VendorCreateData {
			name: string;
			description: string;
			email: string;
			phone: string;
			website: string;
			imageUrl: string;
			userId: string;
		}

		export interface VendorUpdateData {
			id: string;
			name: string;
			description: string;
			email: string;
			phone: string;
			website: string;
			imageUrl: string;
			userId: string;
		}

		export interface VendorLocationUpdate {
			vendorId: string;
			location: Location;
			timestamp: string;
		}

		export interface GeospatialBounds {
			neBounds: Location;
			swBounds: Location;
		}

		/**
		 * User avatar
		 */
		export interface UserAvatar {
			url: string;
			fileId: string;
			uploadedAt: string;
		}

		/**
		 * Vendor logo
		 */
		export interface VendorLogo {
			url: string;
			fileId: string;
			uploadedAt: string;
		}

		/**
		 * User in the marketplace
		 */
		export interface User {
			id: string;
			email: string | null;
			firstName?: string;
			lastName?: string;
			createdAt: string;
			updatedAt: string;
			isActive: boolean;
			subscription?: UserSubscription;
			location?: UserLocation;
		}

		/**
		 * Vendor in the marketplace
		 */
		export interface Vendor {
			id: string;
			name: string;
			description: string;
			email: string;
			phone?: string;
			website?: string;
			isOpen: boolean;
			imageUrl?: string;
			location?: VendorLocation;
			ownerId: string;
			createdAt: string;
			updatedAt: string;
		}

		/**
		 * Location data
		 */
		export interface Location {
			lat: number;
			lng: number;
		}

		export interface UserLocation extends Location {
			userId: string;
			updatedAt: string;
		}

		export interface VendorLocation extends Location {
			vendorId: string;
			updatedAt: string;
		}

		export interface LocationBounds {
			swBounds: Location;
			neBounds: Location;
		}
	}

	// ============================================================================
	// External Service Types
	// Types for external service data (part of our ACL)
	// ============================================================================
	export namespace External {
		/**
		 * Clerk user data
		 */
		export interface ClerkUser {
			id: string;
			email_addresses: Array<{
				email_address: string;
				verification?: {
					status: 'verified' | 'unverified';
				};
			}>;
			first_name?: string;
			last_name?: string;
			created_at: string;
			updated_at: string;
			metadata?: Record<string, unknown>;
		}

		/**
		 * RevenueCat subscription data
		 */
		export interface RevenueCatSubscription {
			id: string;
			user_id: string;
			product_id: string;
			transaction_id: string;
			status: 'active' | 'cancelled' | 'expired';
			period_type: 'normal' | 'trial';
			purchased_at: string;
			expires_at?: string;
		}
	}

	// ============================================================================
	// Contract Types
	// Types that other domains use when interacting with Marketplace
	// ============================================================================
	export namespace Contracts {
		/**
		 * User context for authentication
		 */
		export interface UserRegistrationRequest {
			clerkId: string;
			source?: 'clerk_webhook' | 'manual' | 'admin';
		}

		export interface UserLocationUpdate {
			userId: string;
			location: Core.Location;
			timestamp: string;
		}

		export interface UserContext {
			userId: string;
			roles: string[];
			metadata: Record<string, string>;
		}

		/**
		 * Location service contract for vendor updates
		 */
		export interface VendorLocationUpdate {
			vendorId: string;
			location: Core.Location;
			timestamp: string;
		}

		/**
		 * Communication service contract for user events
		 */
		export interface UserEventData {
			userId: string;
			eventType: 'created' | 'updated' | 'deleted';
			timestamp: string;
			metadata?: Record<string, unknown>;
		}
	}

	// ============================================================================
	// Validation Schemas
	// Zod schemas for validating domain types
	// ============================================================================
	export namespace Validation {
		export const LocationSchema = z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		});

		export const VendorSchema = z.object({
			id: z.string().uuid(),
			name: z.string().min(1),
			description: z.string(),
			email: z.string().email(),
			phone: z.string().optional(),
			website: z.string().url().optional(),
			isOpen: z.boolean(),
			imageUrl: z.string().url().optional(),
			location: LocationSchema.optional(),
			ownerId: z.string().uuid(),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
		});

		export const UserSchema = z.object({
			id: z.string().uuid(),
			email: z.string().email().nullable(),
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			isActive: z.boolean(),
			subscription: z
				.object({
					id: z.string().uuid(),
					userId: z.string().uuid(),
					status: z.enum(['active', 'cancelled', 'expired']),
					provider: z.literal('revenuecat'),
					externalId: z.string(),
					productId: z.string(),
					startDate: z.string().datetime(),
					endDate: z.string().datetime().optional(),
				})
				.optional(),
			location: LocationSchema.optional(),
		});
	}

	// ============================================================================
	// Event Types
	// Types for domain events
	// ============================================================================
	export namespace Events {
		/**
		 * Vendor events
		 */
		export interface VendorCreated {
			vendorId: string;
			ownerId: string;
			timestamp: string;
		}

		export interface VendorUpdated {
			vendorId: string;
			updatedFields: Array<keyof Core.Vendor>;
			timestamp: string;
		}

		export interface VendorLocationChanged {
			vendorId: string;
			location: Core.Location;
			timestamp: string;
		}

		export interface VendorDeleted {
			vendorId: string;
			timestamp: string;
		}

		/**
		 * User events
		 */
		export interface UserCreated {
			userId: string;
			timestamp: string;
		}

		export interface UserSubscriptionChanged {
			userId: string;
			subscriptionId: string;
			status: Core.UserSubscription['status'];
			timestamp: string;
		}

		export interface UserLocationChanged {
			userId: string;
			location: Core.Location;
			timestamp: string;
		}

		export interface UserDeleted {
			userId: string;
			timestamp: string;
		}
	}
}

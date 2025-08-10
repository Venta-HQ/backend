/**
 * User Domain Types
 *
 * Internal domain representations that map to/from gRPC types.
 * These are the "clean" types that represent our domain concepts.
 *
 * Mapping:
 * - UserIdentityData (gRPC) -> UserIdentity (Domain)
 * - CreateSubscriptionData (gRPC) -> SubscriptionCreate (Domain)
 */

// ============================================================================
// User Identity (from gRPC UserIdentityData)
// ============================================================================

export interface UserIdentity {
	id: string;
}

// ============================================================================
// User Profile (internal representation)
// ============================================================================

export interface User {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	imageUrl?: string;
	createdAt: string;
	updatedAt: string;
	isActive: boolean;
}

// ============================================================================
// Subscription Management (from gRPC CreateSubscriptionData)
// ============================================================================

export interface SubscriptionCreate {
	userId: string; // Mapped from clerkUserId in gRPC
	providerId: string;
	data: SubscriptionProviderData;
}

export interface SubscriptionProviderData {
	eventId: string;
	productId: string;
	transactionId: string;
}

// ============================================================================
// User-Vendor Relationship (from gRPC UserVendorData)
// ============================================================================

export interface UserVendorQuery {
	userId: string;
}

export interface UserVendorResult {
	id: string;
	name: string;
}

// ============================================================================
// User Registration (for internal user creation)
// ============================================================================

export interface UserRegistrationRequest {
	clerkId: string;
	source: 'clerk_webhook' | 'manual';
}

// ============================================================================
// User Location (for location updates)
// ============================================================================

export interface UserLocationUpdate {
	userId: string;
	location: {
		lat: number;
		long: number;
	};
}

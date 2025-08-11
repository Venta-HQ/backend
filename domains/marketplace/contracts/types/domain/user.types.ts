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

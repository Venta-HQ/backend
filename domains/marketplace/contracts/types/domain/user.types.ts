/**
 * User Domain Types
 *
 * Internal domain representations that map to/from gRPC types.
 * These are the "clean" types that represent our domain concepts.
 *
 * Mapping:
 * - UserIdentityData (gRPC) -> UserIdentity (Domain)
 */

// ============================================================================
// User Identity (from gRPC UserIdentityData)
// ==========================================================================

export interface UserIdentity {
	id: string;
}

// ==========================================================================
// User-Vendor Relationship (from gRPC UserVendorData)
// ==========================================================================

export interface UserVendorResult {
	id: string;
	name: string;
}

/**
 * Marketplace Contracts Index
 *
 * Main export point for marketplace domain contracts including:
 * - ACL classes for gRPC ↔ Domain transformations
 * - Type definitions organized by purpose
 */

// ============================================================================
// ACL CLASSES - Bidirectional gRPC ↔ Domain transformation
// ============================================================================

// User-related ACL classes (bidirectional gRPC ↔ Domain)
export { UserVendorQueryACL } from './acl/user.acl';

// Vendor-related ACL classes (bidirectional gRPC ↔ Domain)
export {
	VendorLookupACL,
	VendorCreateACL,
	VendorUpdateACL,
	VendorLocationUpdateACL,
	VendorGeospatialBoundsACL,
} from './acl/vendor.acl';

// Authentication-related ACL classes (bidirectional gRPC ↔ Domain)
export { UserIdentityACL } from './acl/auth.acl';

// Subscription-related ACL classes (bidirectional gRPC ↔ Domain)
export { SubscriptionCreateACL } from './acl/subscription.acl';

// ============================================================================
// Type Re-exports
// ============================================================================

// Type categories (accessible via contracts.Types.domain.*, contracts.Types.internal.*)
export * as Types from './types';

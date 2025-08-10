/**
 * Marketplace Contracts Index
 *
 * Main export point for marketplace domain contracts including:
 * - ACL pipes for gRPC -> Domain transformations
 * - Type definitions organized by purpose
 * - Legacy exports for backward compatibility
 */

// ============================================================================
// ACL Pipes - gRPC to Domain Transformations
// ============================================================================

// ============================================================================
// ACL CLASSES - Bidirectional gRPC ↔ Domain transformation
// ============================================================================

// User-related ACL classes (bidirectional gRPC ↔ Domain)
export { UserIdentityACL, SubscriptionCreateACL, UserVendorQueryACL } from './acl/user.acl';

// Vendor-related ACL classes (bidirectional gRPC ↔ Domain)
export {
	VendorLookupACL,
	VendorCreateACL,
	VendorUpdateACL,
	VendorLocationUpdateACL,
	VendorGeospatialBoundsACL,
} from './acl/vendor.acl';

// Note: For inter-domain communication (to other domains), those ACLs are
// defined in the respective domain contracts that need to communicate with this domain

// ============================================================================
// EXTERNAL SERVICE ACL PIPES - External APIs → Domain
// ============================================================================

// Clerk (Authentication) ACL pipes
export { ClerkUserIdentityACLPipe, ClerkUserTransformACLPipe } from './acl/external/clerk.acl';

// RevenueCat (Subscriptions) ACL pipes
export { RevenueCatSubscriptionACLPipe, RevenueCatSubscriptionTransformACLPipe } from './acl/external/revenuecat.acl';

// Algolia (Search) ACL pipes
export {
	AlgoliaSearchRecordACLPipe,
	AlgoliaSearchUpdateACLPipe,
	AlgoliaLocationUpdateACLPipe,
} from './acl/external/algolia.acl';

// NATS (Messaging) ACL pipes
export { NatsSubscriptionOptionsACLPipe, NatsDomainEventACLPipe } from './acl/external/nats.acl';

// ============================================================================
// Type Re-exports
// ============================================================================

// Main type categories
export * as Types from './types';

// Convenience re-exports for most common types
export type { UserIdentity, VendorCreate, VendorUpdate, VendorEntity, Coordinates } from './types/domain';

export type { UserProfile, VendorProfile, ClerkUser, RevenueCatSubscription } from './types/internal';

// ============================================================================
// Modules
// ============================================================================

export { MarketplaceContractsModule } from './marketplace-contracts.module';

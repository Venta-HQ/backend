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
// INBOUND ACL PIPES - gRPC → Domain
// ============================================================================

// User-related inbound ACL pipes
export { UserIdentityACLPipe, SubscriptionCreateACLPipe, UserVendorQueryACLPipe } from './acl/inbound/user.acl';

// Vendor-related inbound ACL pipes
export {
	VendorLookupACLPipe,
	VendorCreateACLPipe,
	VendorUpdateACLPipe,
	VendorLocationUpdateACLPipe,
	VendorGeospatialBoundsACLPipe,
} from './acl/inbound/vendor.acl';

// ============================================================================
// OUTBOUND ACL PIPES - Domain → gRPC (to other domains)
// ============================================================================

// Communication domain outbound ACL pipes
export {
	UserEventCommunicationACLPipe,
	VendorEventCommunicationACLPipe,
	SubscriptionEventCommunicationACLPipe,
} from './acl/outbound/communication.acl';

// Infrastructure domain outbound ACL pipes
export {
	VendorCreateInfrastructureACLPipe,
	FileUploadInfrastructureACLPipe,
	AuthRequestInfrastructureACLPipe,
	EventPublishInfrastructureACLPipe,
} from './acl/outbound/infrastructure.acl';

// Location services domain outbound ACL pipes
export {
	VendorLocationUpdateLocationACLPipe,
	UserLocationUpdateLocationACLPipe,
	GeospatialBoundsLocationACLPipe,
} from './acl/outbound/location.acl';

// ============================================================================
// EXTERNAL SERVICE ACL PIPES - External APIs → Domain
// ============================================================================

// Clerk (Authentication) ACL pipes
export {
	ClerkUserIdentityACLPipe,
	ClerkUserTransformACLPipe,
	ClerkAntiCorruptionLayer,
} from './acl/external/clerk.acl';

// RevenueCat (Subscriptions) ACL pipes
export {
	RevenueCatSubscriptionACLPipe,
	RevenueCatSubscriptionTransformACLPipe,
	RevenueCatAntiCorruptionLayer,
} from './acl/external/revenuecat.acl';

// Algolia (Search) ACL pipes
export {
	AlgoliaSearchRecordACLPipe,
	AlgoliaSearchUpdateACLPipe,
	AlgoliaLocationUpdateACLPipe,
	AlgoliaACL,
} from './acl/external/algolia.acl';

// NATS (Messaging) ACL pipes
export { NatsSubscriptionOptionsACLPipe, NatsDomainEventACLPipe, NatsACL } from './acl/external/nats.acl';

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

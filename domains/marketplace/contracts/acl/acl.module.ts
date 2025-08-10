import { Module } from '@nestjs/common';
// ============================================================================
// EXTERNAL SERVICE ACL PIPES - External APIs → Domain
// ============================================================================
import {
	AlgoliaLocationUpdateACLPipe,
	AlgoliaSearchRecordACLPipe,
	AlgoliaSearchUpdateACLPipe,
} from './external/algolia.acl';
import { ClerkUserIdentityACLPipe, ClerkUserTransformACLPipe } from './external/clerk.acl';
import { NatsDomainEventACLPipe, NatsSubscriptionOptionsACLPipe } from './external/nats.acl';
import { RevenueCatSubscriptionACLPipe, RevenueCatSubscriptionTransformACLPipe } from './external/revenuecat.acl';
// ============================================================================
// INBOUND ACL PIPES - gRPC → Domain
// ============================================================================
import { SubscriptionCreateACLPipe, UserIdentityACLPipe, UserVendorQueryACLPipe } from './inbound/user.acl';
import {
	VendorCreateACLPipe,
	VendorGeospatialBoundsACLPipe,
	VendorLocationUpdateACLPipe,
	VendorLookupACLPipe,
	VendorUpdateACLPipe,
} from './inbound/vendor.acl';
// ============================================================================
// OUTBOUND ACL PIPES - Domain → gRPC (to other domains)
// ============================================================================
import {
	SubscriptionEventCommunicationACLPipe,
	UserEventCommunicationACLPipe,
	VendorEventCommunicationACLPipe,
} from './outbound/communication.acl';
import {
	AuthRequestInfrastructureACLPipe,
	EventPublishInfrastructureACLPipe,
	FileUploadInfrastructureACLPipe,
	VendorCreateInfrastructureACLPipe,
} from './outbound/infrastructure.acl';
import {
	GeospatialBoundsLocationACLPipe,
	UserLocationUpdateLocationACLPipe,
	VendorLocationUpdateLocationACLPipe,
} from './outbound/location.acl';

/**
 * ACL Module
 *
 * Provides all Anti-Corruption Layer functionality for the marketplace domain.
 * Organized by data flow direction and service type:
 *
 * - **Inbound**: gRPC → Domain types (from other domains)
 * - **Outbound**: Domain → gRPC types (to other domains)
 * - **External**: External APIs → Domain types (non-gRPC services)
 */
@Module({
	providers: [
		// ============================================================================
		// INBOUND ACL PIPES - gRPC → Domain
		// ============================================================================

		// User-related inbound transformations
		UserIdentityACLPipe,
		SubscriptionCreateACLPipe,
		UserVendorQueryACLPipe,

		// Vendor-related inbound transformations
		VendorLookupACLPipe,
		VendorCreateACLPipe,
		VendorUpdateACLPipe,
		VendorLocationUpdateACLPipe,
		VendorGeospatialBoundsACLPipe,

		// ============================================================================
		// OUTBOUND ACL PIPES - Domain → gRPC (to other domains)
		// ============================================================================

		// Communication domain outbound
		UserEventCommunicationACLPipe,
		VendorEventCommunicationACLPipe,
		SubscriptionEventCommunicationACLPipe,

		// Infrastructure domain outbound
		VendorCreateInfrastructureACLPipe,
		FileUploadInfrastructureACLPipe,
		AuthRequestInfrastructureACLPipe,
		EventPublishInfrastructureACLPipe,

		// Location services domain outbound
		VendorLocationUpdateLocationACLPipe,
		UserLocationUpdateLocationACLPipe,
		GeospatialBoundsLocationACLPipe,

		// ============================================================================
		// EXTERNAL SERVICE ACL PIPES - External APIs → Domain
		// ============================================================================

		// Clerk (Authentication)
		ClerkUserIdentityACLPipe,
		ClerkUserTransformACLPipe,

		// RevenueCat (Subscriptions)
		RevenueCatSubscriptionACLPipe,
		RevenueCatSubscriptionTransformACLPipe,

		// Algolia (Search)
		AlgoliaSearchRecordACLPipe,
		AlgoliaSearchUpdateACLPipe,
		AlgoliaLocationUpdateACLPipe,

		// NATS (Messaging)
		NatsSubscriptionOptionsACLPipe,
		NatsDomainEventACLPipe,
	],
	exports: [
		// ============================================================================
		// INBOUND ACL PIPES - gRPC → Domain
		// ============================================================================

		// User-related inbound transformations
		UserIdentityACLPipe,
		SubscriptionCreateACLPipe,
		UserVendorQueryACLPipe,

		// Vendor-related inbound transformations
		VendorLookupACLPipe,
		VendorCreateACLPipe,
		VendorUpdateACLPipe,
		VendorLocationUpdateACLPipe,
		VendorGeospatialBoundsACLPipe,

		// ============================================================================
		// OUTBOUND ACL PIPES - Domain → gRPC (to other domains)
		// ============================================================================

		// Communication domain outbound
		UserEventCommunicationACLPipe,
		VendorEventCommunicationACLPipe,
		SubscriptionEventCommunicationACLPipe,

		// Infrastructure domain outbound
		VendorCreateInfrastructureACLPipe,
		FileUploadInfrastructureACLPipe,
		AuthRequestInfrastructureACLPipe,
		EventPublishInfrastructureACLPipe,

		// Location services domain outbound
		VendorLocationUpdateLocationACLPipe,
		UserLocationUpdateLocationACLPipe,
		GeospatialBoundsLocationACLPipe,

		// ============================================================================
		// EXTERNAL SERVICE ACL PIPES - External APIs → Domain
		// ============================================================================

		// Clerk (Authentication)
		ClerkUserIdentityACLPipe,
		ClerkUserTransformACLPipe,

		// RevenueCat (Subscriptions)
		RevenueCatSubscriptionACLPipe,
		RevenueCatSubscriptionTransformACLPipe,

		// Algolia (Search)
		AlgoliaSearchRecordACLPipe,
		AlgoliaSearchUpdateACLPipe,
		AlgoliaLocationUpdateACLPipe,

		// NATS (Messaging)
		NatsSubscriptionOptionsACLPipe,
		NatsDomainEventACLPipe,
	],
})
export class ACLModule {}

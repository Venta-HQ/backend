import { Module } from '@nestjs/common';
// ============================================================================
// EXTERNAL SERVICE ACL PIPES - External APIs → Domain
// ============================================================================
import {
	AlgoliaACL,
	AlgoliaLocationUpdateACLPipe,
	AlgoliaSearchRecordACLPipe,
	AlgoliaSearchUpdateACLPipe,
} from './external/algolia.acl';
import { ClerkAntiCorruptionLayer, ClerkUserIdentityACLPipe, ClerkUserTransformACLPipe } from './external/clerk.acl';
import { NatsACL, NatsDomainEventACLPipe, NatsSubscriptionOptionsACLPipe } from './external/nats.acl';
import {
	RevenueCatAntiCorruptionLayer,
	RevenueCatSubscriptionACLPipe,
	RevenueCatSubscriptionTransformACLPipe,
} from './external/revenuecat.acl';
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
		ClerkAntiCorruptionLayer, // Legacy service

		// RevenueCat (Subscriptions)
		RevenueCatSubscriptionACLPipe,
		RevenueCatSubscriptionTransformACLPipe,
		RevenueCatAntiCorruptionLayer, // Legacy service

		// Algolia (Search)
		AlgoliaSearchRecordACLPipe,
		AlgoliaSearchUpdateACLPipe,
		AlgoliaLocationUpdateACLPipe,
		AlgoliaACL, // Legacy service

		// NATS (Messaging)
		NatsSubscriptionOptionsACLPipe,
		NatsDomainEventACLPipe,
		NatsACL, // Legacy service
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
		ClerkAntiCorruptionLayer, // Legacy service

		// RevenueCat (Subscriptions)
		RevenueCatSubscriptionACLPipe,
		RevenueCatSubscriptionTransformACLPipe,
		RevenueCatAntiCorruptionLayer, // Legacy service

		// Algolia (Search)
		AlgoliaSearchRecordACLPipe,
		AlgoliaSearchUpdateACLPipe,
		AlgoliaLocationUpdateACLPipe,
		AlgoliaACL, // Legacy service

		// NATS (Messaging)
		NatsSubscriptionOptionsACLPipe,
		NatsDomainEventACLPipe,
		NatsACL, // Legacy service
	],
})
export class ACLModule {}

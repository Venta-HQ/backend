/**
 * External Service Types
 *
 * Types for external services (Clerk, RevenueCat, etc.) that are NOT gRPC.
 * These represent the external API contracts we integrate with.
 */

// ============================================================================
// Clerk Authentication Service
// ============================================================================

export interface ClerkUser {
	id: string;
	email_addresses: Array<{
		email_address: string;
		verification?: {
			status: 'verified' | 'unverified';
			strategy?: string;
		};
	}>;
	first_name?: string;
	last_name?: string;
	image_url?: string;
	created_at: number; // Unix timestamp
	updated_at: number; // Unix timestamp
	metadata?: Record<string, unknown>;
}

export interface ClerkWebhookEvent<T = unknown> {
	data: T;
	object: string;
	type: string;
	timestamp: number;
}

export type ClerkUserEvent = ClerkWebhookEvent<ClerkUser> & {
	type: 'user.created' | 'user.updated' | 'user.deleted';
};

// ============================================================================
// RevenueCat Subscription Service
// ============================================================================

export interface RevenueCatSubscription {
	id: string;
	user_id: string; // Maps to clerkUserId
	product_id: string;
	transaction_id: string;
	status: 'active' | 'cancelled' | 'expired' | 'trial';
	period_type: 'normal' | 'trial' | 'promotional';
	purchased_at: string; // ISO string
	expires_at?: string; // ISO string
	auto_renew_status: boolean;
	is_sandbox: boolean;
}

export interface RevenueCatWebhookEvent<T = unknown> {
	api_version: string;
	event: T;
	app_id: string;
}

export enum RevenueCatEventType {
	INITIAL_PURCHASE = 'INITIAL_PURCHASE',
	RENEWAL = 'RENEWAL',
	CANCELLATION = 'CANCELLATION',
	EXPIRATION = 'EXPIRATION',
	BILLING_ISSUE = 'BILLING_ISSUE',
}

export interface RevenueCatInitialPurchaseEvent {
	aliases: string[];
	app_id: string;
	app_user_id: string; // Clerk user ID
	country_code: string;
	currency: string;
	entitlement_id: string | null;
	entitlement_ids: string[];
	environment: 'SANDBOX' | 'PRODUCTION';
	event_timestamp_ms: number;
	expiration_at_ms: number;
	id: string;
	is_family_share: boolean;
	offer_code: string | null;
	original_app_user_id: string;
	original_transaction_id: string;
	period_type: string;
	presented_offering_id: string | null;
	price: number;
	price_in_purchased_currency: number;
	product_id: string;
	purchased_at_ms: number;
	store: 'APP_STORE' | 'PLAY_STORE' | 'AMAZON' | 'STRIPE';
	subscriber_attributes: {
		clerkUserId: string;
		[key: string]: unknown;
	};
	takehome_percentage: number;
	transaction_id: string;
	type: RevenueCatEventType;
}

// ============================================================================
// Algolia Search Service
// ============================================================================

export interface AlgoliaSearchRecord {
	objectID: string;
	name: string;
	description: string;
	category: string;
	tags: string[];
	location: {
		lat: number;
		lng: number;
	};
	isOpen: boolean;
	rating: number;
	imageUrl: string;
	// Algolia-specific fields
	_geoloc: {
		lat: number;
		lng: number;
	};
	_tags: string[];
}

export interface AlgoliaIndexConfig {
	indexName: string;
	searchableAttributes: string[];
	attributesForFaceting: string[];
	ranking: string[];
	customRanking: string[];
}

// ============================================================================
// NATS Event Streaming
// ============================================================================

export interface NatsDomainEvent {
	eventType: string;
	aggregateId: string;
	aggregateType: string;
	eventVersion: number;
	eventData: unknown;
	metadata: {
		correlationId: string;
		causationId: string;
		timestamp: string;
		source: string;
	};
}

export interface NatsSubscriptionOptions {
	subject: string;
	queue?: string;
	durableName?: string;
	deliverPolicy: 'all' | 'last' | 'new' | 'by_start_sequence' | 'by_start_time';
	ackPolicy: 'none' | 'all' | 'explicit';
	maxAckPending?: number;
	maxDeliver?: number;
	replayPolicy: 'instant' | 'original';
}

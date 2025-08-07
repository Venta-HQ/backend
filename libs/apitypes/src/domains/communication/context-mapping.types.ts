/**
 * Communication Domain Context Mapping Types
 *
 * These types define the context mapping interfaces for the communication domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Communication ↔ Marketplace Context Mapping
// ============================================================================

/**
 * Maps communication concepts to marketplace domain
 */
export interface CommunicationMarketplaceMapping {
	/**
	 * External user mapping between communication and marketplace contexts
	 */
	externalUser: {
		/** External service user ID */
		externalUserId: string;
		/** External service name */
		externalService: 'clerk' | 'revenuecat';
		/** Internal marketplace user ID */
		marketplaceUserId: string;
		/** Mapping timestamp */
		timestamp: string;
	};

	/**
	 * External subscription mapping between communication and marketplace contexts
	 */
	externalSubscription: {
		/** External service subscription ID */
		externalSubscriptionId: string;
		/** External service name */
		externalService: 'revenuecat';
		/** Internal marketplace subscription ID */
		marketplaceSubscriptionId: string;
		/** Mapping timestamp */
		timestamp: string;
	};
}

/**
 * External user data from communication context
 */
export interface CommunicationExternalUserData {
	/** External service user ID */
	externalUserId: string;
	/** External service name */
	service: 'clerk' | 'revenuecat';
	/** User data from external service */
	data: Record<string, any>;
	/** Event timestamp */
	timestamp: string;
}

/**
 * External subscription data from communication context
 */
export interface CommunicationExternalSubscriptionData {
	/** External service subscription ID */
	externalSubscriptionId: string;
	/** External service name */
	service: 'revenuecat';
	/** Subscription data from external service */
	data: {
		productId: string;
		transactionId: string;
		status: string;
		[key: string]: any;
	};
	/** Event timestamp */
	timestamp: string;
}

/**
 * External user mapping for identity resolution
 */
export interface CommunicationExternalUserMapping {
	/** Internal marketplace user ID */
	marketplaceUserId: string;
	/** External service mappings */
	externalMappings: {
		clerk?: string;
		revenuecat?: string;
	};
	/** Mapping creation timestamp */
	createdAt: string;
	/** Mapping last updated timestamp */
	updatedAt: string;
}

// ============================================================================
// Communication ↔ Infrastructure Context Mapping
// ============================================================================

/**
 * Maps communication concepts to infrastructure domain
 */
export interface CommunicationInfrastructureMapping {
	/**
	 * Webhook processing mapping
	 */
	webhookProcessing: {
		/** Communication domain identifier */
		domain: 'communication';
		/** Webhook source */
		source: 'clerk' | 'revenuecat' | 'stripe';
		/** Webhook event type */
		eventType: string;
		/** Processing status */
		status: 'received' | 'processed' | 'failed';
		/** Processing timestamp */
		timestamp: string;
	};

	/**
	 * External service integration mapping
	 */
	externalIntegration: {
		/** Communication domain identifier */
		domain: 'communication';
		/** External service name */
		service: 'clerk' | 'revenuecat' | 'stripe';
		/** Integration type */
		integrationType: 'webhook' | 'api' | 'sdk';
		/** Integration status */
		status: 'active' | 'inactive' | 'error';
		/** Last sync timestamp */
		lastSync: string;
	};
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Validation schema for communication-marketplace mapping
 */
export const CommunicationMarketplaceMappingSchema = z.object({
	externalUser: z.object({
		externalUserId: z.string(),
		externalService: z.enum(['clerk', 'revenuecat']),
		marketplaceUserId: z.string(),
		timestamp: z.string(),
	}),
	externalSubscription: z.object({
		externalSubscriptionId: z.string(),
		externalService: z.literal('revenuecat'),
		marketplaceSubscriptionId: z.string(),
		timestamp: z.string(),
	}),
});

/**
 * Validation schema for communication-infrastructure mapping
 */
export const CommunicationInfrastructureMappingSchema = z.object({
	webhookProcessing: z.object({
		domain: z.literal('communication'),
		source: z.enum(['clerk', 'revenuecat', 'stripe']),
		eventType: z.string(),
		status: z.enum(['received', 'processed', 'failed']),
		timestamp: z.string(),
	}),
	externalIntegration: z.object({
		domain: z.literal('communication'),
		service: z.enum(['clerk', 'revenuecat', 'stripe']),
		integrationType: z.enum(['webhook', 'api', 'sdk']),
		status: z.enum(['active', 'inactive', 'error']),
		lastSync: z.string(),
	}),
});

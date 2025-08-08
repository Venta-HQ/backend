/**
 * Communication Domain Types
 *
 * These types define the core concepts and contracts for the communication domain.
 * The domain is responsible for handling external service webhooks, notifications,
 * and communication between external services and our internal domains.
 */

import { z } from 'zod';

export namespace Communication {
	// ============================================================================
	// Core Domain Types
	// Primary types that represent our domain concepts
	// ============================================================================

	/**
	 * External service types supported by the communication domain
	 */
	export type ExternalService = 'clerk' | 'revenuecat';

	/**
	 * Base webhook event from any external service
	 */
	export interface WebhookEvent<T = unknown> {
		/** Event type identifier */
		type: string;
		/** Event source service */
		source: ExternalService;
		/** Event payload */
		payload: T;
		/** Event timestamp */
		timestamp: string;
		/** Event metadata */
		metadata?: WebhookMetadata;
	}

	/**
	 * Webhook event metadata
	 */
	export interface WebhookMetadata {
		/** Event ID from external service */
		externalEventId?: string;
		/** External service environment */
		environment?: 'production' | 'sandbox';
		/** Webhook signature for verification */
		signature?: string;
		/** Additional context */
		[key: string]: string | undefined;
	}

	// ============================================================================
	// Contract Types
	// Types that other domains use when interacting with Communication
	// ============================================================================
	export namespace Contracts {
		/**
		 * User event contract for other domains
		 */
		export interface UserEvent {
			/** External service user ID */
			externalUserId: string;
			/** External service name */
			service: ExternalService;
			/** Event type */
			type: 'created' | 'updated' | 'deleted';
			/** Event timestamp */
			timestamp: string;
		}

		/**
		 * Subscription event contract for other domains
		 */
		export interface SubscriptionEvent {
			/** External service subscription ID */
			externalSubscriptionId: string;
			/** External service name */
			service: 'revenuecat';
			/** Event type */
			type: 'created' | 'updated' | 'cancelled';
			/** Event timestamp */
			timestamp: string;
		}

		/**
		 * Notification request contract for other domains
		 */
		export interface NotificationRequest {
			/** Target user ID */
			userId: string;
			/** Notification type */
			type: NotificationType;
			/** Notification data */
			data: Record<string, unknown>;
			/** Optional metadata */
			metadata?: Record<string, string>;
		}
	}

	// ============================================================================
	// Internal Types
	// Types used within the Communication domain
	// ============================================================================
	export namespace Internal {
		/**
		 * Webhook verification config
		 */
		export interface WebhookVerificationConfig {
			/** Secret key for verification */
			secret: string;
			/** Verification algorithm */
			algorithm: 'sha256' | 'sha512';
			/** Header containing signature */
			signatureHeader: string;
			/** Timestamp tolerance in seconds */
			tolerance: number;
		}

		/**
		 * Notification type configuration
		 */
		export interface NotificationConfig {
			/** Template ID or key */
			templateId: string;
			/** Required data fields */
			requiredFields: string[];
			/** Optional data fields */
			optionalFields?: string[];
			/** Delivery channels */
			channels: Array<'email' | 'push' | 'sms'>;
		}
	}

	// ============================================================================
	// Event Types
	// Types for domain events
	// ============================================================================
	export namespace Events {
		/**
		 * Webhook received event
		 */
		export interface WebhookReceived {
			service: ExternalService;
			eventType: string;
			timestamp: string;
			metadata?: WebhookMetadata;
		}

		/**
		 * Notification sent event
		 */
		export interface NotificationSent {
			userId: string;
			type: NotificationType;
			channels: Array<'email' | 'push' | 'sms'>;
			timestamp: string;
		}
	}

	// ============================================================================
	// Validation Schemas
	// Zod schemas for validating domain types
	// ============================================================================
	export namespace Validation {
		export const WebhookMetadataSchema = z
			.object({
				externalEventId: z.string().optional(),
				environment: z.enum(['production', 'sandbox']).optional(),
				signature: z.string().optional(),
			})
			.catchall(z.string());

		export const WebhookEventSchema = z.object({
			type: z.string(),
			source: z.enum(['clerk', 'revenuecat']),
			payload: z.unknown(),
			timestamp: z.string().datetime(),
			metadata: WebhookMetadataSchema.optional(),
		});

		export const NotificationRequestSchema = z.object({
			userId: z.string(),
			type: z.enum(['welcome', 'order_status', 'vendor_update', 'subscription_status']),
			data: z.record(z.unknown()),
			metadata: z.record(z.string()).optional(),
		});
	}

	// ============================================================================
	// Shared Types
	// Common types used throughout the domain
	// ============================================================================

	/**
	 * Supported notification types
	 */
	export type NotificationType = 'welcome' | 'order_status' | 'vendor_update' | 'subscription_status';
}

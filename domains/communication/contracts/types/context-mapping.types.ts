/**
 * Communication Domain Context Mapping Types
 *
 * These types define the context mapping interfaces for the communication domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Communication Domain Types
// ============================================================================

export namespace Communication {
	/**
	 * External service types supported by the communication domain
	 */
	export type ExternalService = 'clerk' | 'revenuecat';

	/**
	 * Webhook event from external service
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
		metadata?: {
			/** Event ID from external service */
			externalEventId?: string;
			/** External service environment */
			environment?: 'production' | 'sandbox';
			/** Additional context */
			[key: string]: string | undefined;
		};
	}

	/**
	 * External service user event
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
	 * External service subscription event
	 */
	export interface SubscriptionEvent {
		/** External service subscription ID */
		externalSubscriptionId: string;
		/** External service name */
		service: ExternalService;
		/** Event type */
		type: 'created' | 'updated' | 'cancelled';
		/** Event timestamp */
		timestamp: string;
	}
}

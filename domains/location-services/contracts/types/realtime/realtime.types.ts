/**
 * Real-time Domain Types
 *
 * These types define the core concepts and contracts for the real-time domain.
 * The domain is responsible for handling WebSocket connections, real-time events,
 * and NATS message handling.
 */

// Validation schemas moved to ../schemas/realtime.schemas

export namespace RealTime {
	// ============================================================================
	// Core Domain Types
	// Primary types that represent our domain concepts
	// ============================================================================
	export namespace Core {
		/**
		 * WebSocket client connection
		 */
		export interface ClientConnection {
			/** Client ID */
			id: string;
			/** User ID */
			userId: string;
			/** Connection timestamp */
			connectedAt: string;
			/** Subscribed topics */
			subscriptions: string[];
			/** Client metadata */
			metadata: Record<string, string>;
		}

		/**
		 * Real-time message
		 */
		export interface Message<T = unknown> {
			/** Message type */
			type: string;
			/** Message payload */
			payload: T;
			/** Message timestamp */
			timestamp: string;
			/** Message metadata */
			metadata?: MessageMetadata;
		}

		/**
		 * Message metadata
		 */
		export interface MessageMetadata {
			/** Message ID */
			id: string;
			/** Publisher ID */
			publisherId: string;
			/** Message topic */
			topic: string;
			/** Delivery attempts */
			attempts?: number;
		}

		/**
		 * Subscription options
		 */
		export interface SubscriptionOptions {
			/** Topic pattern */
			topic: string;
			/** Queue group */
			queue?: string;
			/** Max in-flight messages */
			maxInFlight?: number;
			/** Delivery timeout */
			timeout?: number;
		}
	}

	// ============================================================================
	// Contract Types
	// Types that other domains use when interacting with Real-time
	// ============================================================================
	export namespace Contracts {
		/**
		 * Location update message
		 */
		export interface LocationUpdate {
			/** Entity ID */
			entityId: string;
			/** Latitude */
			lat: number;
			/** Longitude */
			lng: number;
			/** Update timestamp */
			timestamp: string;
		}

		/**
		 * Vendor status message
		 */
		export interface VendorStatus {
			/** Vendor ID */
			vendorId: string;
			/** Online status */
			isOnline: boolean;
			/** Status timestamp */
			timestamp: string;
		}

		/**
		 * Subscription request
		 */
		export interface SubscriptionRequest {
			/** Topic to subscribe to */
			topic: string;
			/** Subscription options */
			options?: {
				/** Filter pattern */
				filter?: string;
				/** Rate limit */
				rateLimit?: number;
			};
		}
	}

	// ============================================================================
	// Internal Types
	// Types used within the Real-time domain
	// ============================================================================
	export namespace Internal {
		/**
		 * NATS connection options
		 */
		export interface NatsOptions {
			/** Server URLs */
			servers: string[];
			/** Client name */
			name?: string;
			/** Reconnect options */
			reconnect?: {
				/** Max attempts */
				maxAttempts: number;
				/** Delay in ms */
				delayMs: number;
			};
			/** TLS options */
			tls?: {
				/** CA certificate */
				ca?: string;
				/** Client certificate */
				cert?: string;
				/** Client key */
				key?: string;
			};
		}

		/**
		 * WebSocket rate limit config
		 */
		export interface RateLimitConfig {
			/** Window size in seconds */
			windowSec: number;
			/** Max requests per window */
			maxRequests: number;
			/** Error message */
			errorMessage: string;
		}

		/**
		 * Client metrics
		 */
		export interface ClientMetrics {
			/** Messages sent */
			messagesSent: number;
			/** Messages received */
			messagesReceived: number;
			/** Bytes sent */
			bytesSent: number;
			/** Bytes received */
			bytesReceived: number;
			/** Last activity timestamp */
			lastActivity: string;
		}
	}

	// ============================================================================
	// Event Types
	// Types for domain events
	// ============================================================================
	export namespace Events {
		/**
		 * Client connected event
		 */
		export interface ClientConnected {
			/** Client ID */
			clientId: string;
			/** User ID */
			userId: string;
			/** Connection timestamp */
			timestamp: string;
			/** Client metadata */
			metadata: Record<string, string>;
		}

		/**
		 * Client disconnected event
		 */
		export interface ClientDisconnected {
			/** Client ID */
			clientId: string;
			/** Disconnect reason */
			reason: string;
			/** Disconnect timestamp */
			timestamp: string;
		}

		/**
		 * Message published event
		 */
		export interface MessagePublished {
			/** Message ID */
			messageId: string;
			/** Topic */
			topic: string;
			/** Publisher ID */
			publisherId: string;
			/** Publish timestamp */
			timestamp: string;
		}
	}

	// Validation schemas are defined in '../schemas/realtime.schemas'
}

/**
 * Search & Discovery Domain Types
 *
 * These types define the core concepts and contracts for the search & discovery domain.
 * The domain is responsible for managing vendor search indexes and handling real-time
 * updates to search data.
 */
export namespace SearchDiscovery {
	// ============================================================================
	// Core Domain Types
	// Primary types that represent our domain concepts
	// ============================================================================
	export namespace Core {
		/**
		 * Domain event metadata
		 */
		export interface DomainEventMeta {
			domain: string;
			subdomain: string;
			eventId: string;
		}

		/**
		 * Domain event
		 */
		export interface DomainEvent<T = unknown> {
			data: T;
			meta: DomainEventMeta;
			context?: Record<string, unknown>;
		}

		/**
		 * Subscription options
		 */
		export interface SubscriptionOptions {
			topic: string;
			queue?: string;
			maxInFlight?: number;
			timeout?: number;
		}

		/**
		 * Search record
		 */
		export interface SearchRecord
			extends Record<string, string | number | boolean | Date | null | undefined | object | any[]> {
			objectID: string;
			name: string;
			description?: string;
			email?: string;
			isOpen: boolean;
			ownerId: string;
			createdAt: string;
			updatedAt: string;
			_geoloc?: {
				lat: number;
				long: number;
			};
		}

		/**
		 * Search update
		 */
		export interface SearchUpdate
			extends Record<string, string | number | boolean | Date | null | undefined | object | any[]> {
			objectID: string;
			updatedFields: string[];
			timestamp: string;
		}

		/**
		 * Location update
		 */
		export interface LocationUpdate
			extends Record<string, string | number | boolean | Date | null | undefined | object | any[]> {
			objectID: string;
			_geoloc: {
				lat: number;
				long: number;
			};
			timestamp: string;
		}
	}

	// ============================================================================
	// Contract Types
	// Types that other domains use when interacting with Search & Discovery
	// ============================================================================
	export namespace Contracts {
		/**
		 * Search result
		 */
		export interface SearchResult {
			id: string;
			name: string;
			description?: string;
			email?: string;
			isOpen: boolean;
			ownerId: string;
			location?: {
				lat: number;
				long: number;
			};
			createdAt: string;
			updatedAt: string;
		}

		/**
		 * Search query
		 */
		export interface SearchQuery {
			query: string;
			filters?: string[];
			page?: number;
			limit?: number;
			location?: {
				lat: number;
				long: number;
				radius: number;
			};
		}
	}

	// ============================================================================
	// Internal Types
	// Types used within the Search & Discovery domain
	// ============================================================================
	export namespace Internal {
		/**
		 * Algolia index config
		 */
		export interface AlgoliaIndexConfig {
			name: string;
			settings: {
				searchableAttributes: string[];
				attributesForFaceting?: string[];
				customRanking?: string[];
				replicas?: string[];
			};
		}

		/**
		 * Algolia operation error
		 */
		export interface AlgoliaError {
			code: string;
			message: string;
			operation: string;
			objectID?: string;
		}
	}

	// ============================================================================
	// Event Types
	// Types for domain events
	// ============================================================================
	export namespace Events {
		/**
		 * Index sync completed event
		 */
		export interface IndexSyncCompleted {
			indexName: string;
			timestamp: string;
			recordCount: number;
			metadata?: {
				eventId: string;
				subject: string;
			};
		}

		/**
		 * Index sync failed event
		 */
		export interface IndexSyncFailed {
			indexName: string;
			timestamp: string;
			error: {
				code: string;
				message: string;
			};
			metadata?: {
				eventId: string;
				subject: string;
			};
		}

		/**
		 * Vendor indexed event
		 */
		export interface VendorIndexed {
			vendorId: string;
			operation: 'create' | 'update' | 'delete';
			timestamp: string;
			updatedFields?: string[];
		}

		/**
		 * Vendor location indexed event
		 */
		export interface VendorLocationIndexed {
			vendorId: string;
			location: {
				lat: number;
				long: number;
			};
			timestamp: string;
		}
	}

	// Validation schemas are defined under '../../schemas/search'.
}

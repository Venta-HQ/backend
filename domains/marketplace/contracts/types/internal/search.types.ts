/**
 * Search & Discovery Internal Types
 *
 * Internal business logic types for search functionality.
 * These handle search indexing, event processing, and search records.
 */

// ============================================================================
// Domain Event Types
// ============================================================================

export interface DomainEventMeta {
	domain: string;
	subdomain: string;
	eventId: string;
}

export interface DomainEvent<T = unknown> {
	data: T;
	meta: DomainEventMeta;
	context?: Record<string, unknown>;
}

// ============================================================================
// Subscription and Messaging Types
// ============================================================================

export interface SubscriptionOptions {
	topic: string;
	queue?: string;
	maxInFlight?: number;
	timeout?: number;
}

// ============================================================================
// Search Record Types
// ============================================================================

export interface SearchRecord
	extends Record<string, string | number | boolean | Date | null | undefined | object | any[]> {
	objectID: string;
	name: string;
	description?: string;
	email?: string;
	phone?: string;
	website?: string;
	isOpen?: boolean;
	rating?: number;
	imageUrl?: string;
	lat?: number;
	lng?: number;
	address?: string;
	city?: string;
	state?: string;
	zipCode?: string;
	country?: string;
	categories?: string[];
	tags?: string[];
	businessType?: string;
	verificationLevel?: string;
	createdAt?: string;
	updatedAt?: string;
	// Algolia-specific geolocation field
	_geoloc?: {
		lat: number;
		lng: number;
	};
}

// ============================================================================
// Search Operations Types
// ============================================================================

export interface SearchUpdate {
	objectID: string;
	updates: Partial<SearchRecord>;
	timestamp: string;
}

export interface LocationUpdate {
	vendorId: string;
	coordinates: {
		lat: number;
		lng: number;
	};
	address?: {
		street?: string;
		city?: string;
		state?: string;
		zipCode?: string;
		country?: string;
	};
	timestamp: string;
}

// ============================================================================
// Index Configuration Types
// ============================================================================

export interface IndexConfig {
	indexName: string;
	settings: {
		searchableAttributes: string[];
		attributesForFaceting: string[];
		ranking: string[];
		customRanking: string[];
		geolocation?: boolean;
	};
}

export interface AlgoliaIndexConfig {
	indexName: string;
	searchableAttributes: string[];
	attributesForFaceting: string[];
	ranking: string[];
	customRanking: string[];
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface SearchError {
	code: string;
	message: string;
	context?: {
		objectID?: string;
		operation?: string;
		indexName?: string;
	};
}

export interface IndexError extends SearchError {
	indexName: string;
	operation: 'create' | 'update' | 'delete' | 'batch';
}

// ============================================================================
// Event Processing Types
// ============================================================================

export interface EventProcessingResult {
	success: boolean;
	processedCount: number;
	errorCount: number;
	errors?: SearchError[];
	timestamp: string;
}

export interface BatchOperation {
	action: 'addObject' | 'updateObject' | 'deleteObject';
	body: SearchRecord | { objectID: string };
}

export interface BatchResult {
	taskID: number;
	objectIDs: string[];
	timestamp: string;
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchResult {
	id: string;
	name: string;
	description?: string;
	email?: string;
	isOpen: boolean;
	_geoloc?: {
		lat: number;
		lng: number;
	};
}

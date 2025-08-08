/**
 * Infrastructure Domain Context Mapping Types
 *
 * These types define the context mapping interfaces for the infrastructure domain
 * when communicating with other bounded contexts.
 */

import { z } from 'zod';

// ============================================================================
// Infrastructure ↔ All Domains Context Mapping
// ============================================================================

/**
 * Maps infrastructure concepts to all domain contexts
 */
export interface InfrastructureDomainMapping {
	/**
	 * File upload mapping
	 */
	fileUpload: {
		/** Domain identifier */
		domain: 'marketplace' | 'location' | 'communication';
		/** File ID in infrastructure */
		fileId: string;
		/** File metadata */
		metadata: {
			filename: string;
			size: number;
			mimeType: string;
			uploadedBy: string;
		};
		/** Upload timestamp */
		timestamp: string;
	};

	/**
	 * Database connection mapping
	 */
	databaseConnection: {
		/** Domain identifier */
		domain: 'marketplace' | 'location' | 'communication';
		/** Connection identifier */
		connectionId: string;
		/** Database name */
		databaseName: string;
		/** Connection timestamp */
		timestamp: string;
	};

	/**
	 * Event routing mapping
	 */
	eventRouting: {
		/** Source domain */
		sourceDomain: string;
		/** Target domain */
		targetDomain: string;
		/** Event type */
		eventType: string;
		/** Routing timestamp */
		timestamp: string;
	};

	/**
	 * API Gateway routing mapping
	 */
	apiRouting: {
		/** Target domain */
		targetDomain: 'marketplace' | 'location' | 'communication';
		/** Service name */
		serviceName: string;
		/** HTTP method */
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
		/** Request path */
		path: string;
		/** Routing timestamp */
		timestamp: string;
	};

	/**
	 * Infrastructure monitoring mapping
	 */
	infrastructureMonitoring: {
		/** Domain identifier */
		domain: 'marketplace' | 'location' | 'communication' | 'infrastructure';
		/** Service name */
		serviceName: string;
		/** Metric type */
		metricType: 'health' | 'performance' | 'error' | 'usage';
		/** Metric data */
		metricData: Record<string, any>;
		/** Monitoring timestamp */
		timestamp: string;
	};
}

// ============================================================================
// Infrastructure ↔ Marketplace Context Mapping
// ============================================================================

/**
 * Maps infrastructure concepts specifically to marketplace domain
 */
export interface InfrastructureMarketplaceMapping {
	/**
	 * File management for marketplace
	 */
	marketplaceFileManagement: {
		/** File operation type */
		operation: 'upload' | 'download' | 'delete' | 'update';
		/** File ID */
		fileId: string;
		/** File context */
		context: 'vendor_profile' | 'user_profile' | 'product_image' | 'document';
		/** Operation timestamp */
		timestamp: string;
	};

	/**
	 * Database operations for marketplace
	 */
	marketplaceDatabase: {
		/** Database operation type */
		operation: 'read' | 'write' | 'update' | 'delete';
		/** Table name */
		table: 'users' | 'vendors' | 'subscriptions' | 'reviews';
		/** Operation timestamp */
		timestamp: string;
	};
}

// ============================================================================
// Infrastructure ↔ Location Services Context Mapping
// ============================================================================

/**
 * Maps infrastructure concepts specifically to location services domain
 */
export interface InfrastructureLocationMapping {
	/**
	 * Location data storage
	 */
	locationDataStorage: {
		/** Storage operation type */
		operation: 'store' | 'retrieve' | 'update' | 'delete';
		/** Storage type */
		storageType: 'redis' | 'database' | 'cache';
		/** Entity type */
		entityType: 'vendor_location' | 'user_location' | 'geofence';
		/** Operation timestamp */
		timestamp: string;
	};

	/**
	 * Location analytics storage
	 */
	locationAnalytics: {
		/** Analytics operation type */
		operation: 'record' | 'query' | 'aggregate';
		/** Analytics event type */
		eventType: 'location_update' | 'geospatial_query' | 'proximity_alert';
		/** Operation timestamp */
		timestamp: string;
	};
}

// ============================================================================
// Infrastructure ↔ Communication Context Mapping
// ============================================================================

/**
 * Maps infrastructure concepts specifically to communication domain
 */
export interface InfrastructureCommunicationMapping {
	/**
	 * Webhook infrastructure
	 */
	webhookInfrastructure: {
		/** Webhook operation type */
		operation: 'receive' | 'process' | 'forward' | 'retry';
		/** Webhook source */
		source: 'clerk' | 'revenuecat' | 'stripe';
		/** Operation timestamp */
		timestamp: string;
	};

	/**
	 * External service infrastructure
	 */
	externalServiceInfrastructure: {
		/** Service operation type */
		operation: 'connect' | 'disconnect' | 'health_check' | 'sync';
		/** External service name */
		service: 'clerk' | 'revenuecat' | 'stripe';
		/** Operation timestamp */
		timestamp: string;
	};
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Validation schema for infrastructure-domain mapping
 */
export const InfrastructureDomainMappingSchema = z.object({
	fileUpload: z.object({
		domain: z.enum(['marketplace', 'location', 'communication']),
		fileId: z.string(),
		metadata: z.object({
			filename: z.string(),
			size: z.number(),
			mimeType: z.string(),
			uploadedBy: z.string(),
		}),
		timestamp: z.string(),
	}),
	databaseConnection: z.object({
		domain: z.enum(['marketplace', 'location', 'communication']),
		connectionId: z.string(),
		databaseName: z.string(),
		timestamp: z.string(),
	}),
	eventRouting: z.object({
		sourceDomain: z.string(),
		targetDomain: z.string(),
		eventType: z.string(),
		timestamp: z.string(),
	}),
	apiRouting: z.object({
		targetDomain: z.enum(['marketplace', 'location', 'communication']),
		serviceName: z.string(),
		method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
		path: z.string(),
		timestamp: z.string(),
	}),
	infrastructureMonitoring: z.object({
		domain: z.enum(['marketplace', 'location', 'communication', 'infrastructure']),
		serviceName: z.string(),
		metricType: z.enum(['health', 'performance', 'error', 'usage']),
		metricData: z.record(z.any()),
		timestamp: z.string(),
	}),
});

/**
 * Validation schema for infrastructure-marketplace mapping
 */
export const InfrastructureMarketplaceMappingSchema = z.object({
	marketplaceFileManagement: z.object({
		operation: z.enum(['upload', 'download', 'delete', 'update']),
		fileId: z.string(),
		context: z.enum(['vendor_profile', 'user_profile', 'product_image', 'document']),
		timestamp: z.string(),
	}),
	marketplaceDatabase: z.object({
		operation: z.enum(['read', 'write', 'update', 'delete']),
		table: z.enum(['users', 'vendors', 'subscriptions', 'reviews']),
		timestamp: z.string(),
	}),
});

/**
 * Validation schema for infrastructure-location mapping
 */
export const InfrastructureLocationMappingSchema = z.object({
	locationDataStorage: z.object({
		operation: z.enum(['store', 'retrieve', 'update', 'delete']),
		storageType: z.enum(['redis', 'database', 'cache']),
		entityType: z.enum(['vendor_location', 'user_location', 'geofence']),
		timestamp: z.string(),
	}),
	locationAnalytics: z.object({
		operation: z.enum(['record', 'query', 'aggregate']),
		eventType: z.enum(['location_update', 'geospatial_query', 'proximity_alert']),
		timestamp: z.string(),
	}),
});

/**
 * Validation schema for infrastructure-communication mapping
 */
export const InfrastructureCommunicationMappingSchema = z.object({
	webhookInfrastructure: z.object({
		operation: z.enum(['receive', 'process', 'forward', 'retry']),
		source: z.enum(['clerk', 'revenuecat', 'stripe']),
		timestamp: z.string(),
	}),
	externalServiceInfrastructure: z.object({
		operation: z.enum(['connect', 'disconnect', 'health_check', 'sync']),
		service: z.enum(['clerk', 'revenuecat', 'stripe']),
		timestamp: z.string(),
	}),
});

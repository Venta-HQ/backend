/**
 * Marketplace Domain Contract Interfaces
 *
 * These interfaces define the contracts for marketplace domain communication
 * with other bounded contexts.
 */

import { Observable } from 'rxjs';
import {
	MarketplaceLocationBounds,
	MarketplaceLocationUpdate,
	MarketplaceUserLocation,
	MarketplaceVendorLocation,
} from './context-mapping.types';

// ============================================================================
// Marketplace ↔ Location Services Contract
// ============================================================================

/**
 * Contract for marketplace to location services communication
 */
export interface MarketplaceLocationContract {
	/**
	 * Update vendor location in the location domain
	 */
	updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void>;

	/**
	 * Update user location in the location domain
	 */
	updateUserLocation(userId: string, location: { lat: number; lng: number }): Promise<void>;

	/**
	 * Get vendor location from the location domain
	 */
	getVendorLocation(vendorId: string): Promise<{ lat: number; lng: number } | null>;

	/**
	 * Get user location from the location domain
	 */
	getUserLocation(userId: string): Promise<{ lat: number; lng: number } | null>;

	/**
	 * Get vendors in a specific geographic area
	 */
	getVendorsInArea(bounds: MarketplaceLocationBounds): Promise<MarketplaceVendorLocation[]>;

	/**
	 * Subscribe to real-time vendor location updates
	 */
	subscribeToVendorLocation(vendorId: string): Observable<MarketplaceLocationUpdate>;

	/**
	 * Subscribe to real-time user location updates
	 */
	subscribeToUserLocation(userId: string): Observable<MarketplaceLocationUpdate>;

	/**
	 * Get nearby vendors within a radius
	 */
	getNearbyVendors(center: { lat: number; lng: number }, radiusInMeters: number): Promise<MarketplaceVendorLocation[]>;
}

// ============================================================================
// Marketplace ↔ Communication Contract
// ============================================================================

/**
 * Contract for marketplace to communication domain
 */
export interface MarketplaceCommunicationContract {
	/**
	 * Handle external user creation event
	 */
	handleUserCreated(
		externalUserId: string,
		userData: {
			service: 'clerk' | 'revenuecat';
			data: Record<string, any>;
		},
	): Promise<void>;

	/**
	 * Handle external user deletion event
	 */
	handleUserDeleted(externalUserId: string, service: 'clerk' | 'revenuecat'): Promise<void>;

	/**
	 * Handle external subscription creation event
	 */
	handleSubscriptionCreated(externalData: {
		externalSubscriptionId: string;
		service: 'revenuecat';
		data: {
			productId: string;
			transactionId: string;
			status: string;
			[key: string]: any;
		};
	}): Promise<void>;

	/**
	 * Get external user mapping for identity resolution
	 */
	getExternalUserMapping(internalUserId: string): Promise<{
		marketplaceUserId: string;
		externalMappings: {
			clerk?: string;
			revenuecat?: string;
		};
	} | null>;

	/**
	 * Get internal user mapping from external ID
	 */
	getInternalUserMapping(externalUserId: string, service: 'clerk' | 'revenuecat'): Promise<string | null>;

	/**
	 * Create external user mapping
	 */
	createExternalUserMapping(mapping: {
		marketplaceUserId: string;
		externalUserId: string;
		service: 'clerk' | 'revenuecat';
	}): Promise<void>;
}

// ============================================================================
// Marketplace ↔ Infrastructure Contract
// ============================================================================

/**
 * Contract for marketplace to infrastructure services
 */
export interface MarketplaceInfrastructureContract {
	/**
	 * Upload file to infrastructure
	 */
	uploadFile(file: {
		filename: string;
		buffer: Buffer;
		mimeType: string;
		uploadedBy: string;
		context: 'vendor_profile' | 'user_profile' | 'product_image' | 'document';
	}): Promise<{
		fileId: string;
		url: string;
		metadata: {
			filename: string;
			size: number;
			mimeType: string;
			uploadedBy: string;
		};
	}>;

	/**
	 * Get file from infrastructure
	 */
	getFile(fileId: string): Promise<{
		fileId: string;
		url: string;
		metadata: {
			filename: string;
			size: number;
			mimeType: string;
			uploadedBy: string;
		};
	} | null>;

	/**
	 * Delete file from infrastructure
	 */
	deleteFile(fileId: string): Promise<void>;

	/**
	 * Get database connection for marketplace
	 */
	getDatabaseConnection(): Promise<{
		connectionId: string;
		databaseName: string;
		isConnected: boolean;
	}>;

	/**
	 * Publish marketplace event to messaging infrastructure
	 */
	publishEvent(event: { type: string; data: Record<string, any>; metadata?: Record<string, any> }): Promise<void>;

	/**
	 * Subscribe to marketplace events from messaging infrastructure
	 */
	subscribeToEvents(eventTypes: string[]): Observable<{
		type: string;
		data: Record<string, any>;
		metadata?: Record<string, any>;
		timestamp: string;
	}>;
}

import { TransformationUtils, ValidationUtils } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import {
	MarketplaceLocationBounds,
	MarketplaceLocationUpdate,
	MarketplaceUserLocation,
	MarketplaceVendorLocation,
} from '../types';

/**
 * Context Mapper for Marketplace → Location Services communication
 *
 * Translates Marketplace domain concepts to Location Services domain concepts
 * This is an OUTBOUND context mapper from Marketplace domain
 */
@Injectable()
export class MarketplaceToLocationContextMapper {
	private readonly logger = new Logger('MarketplaceToLocationContextMapper');

	/**
	 * Validate source data from marketplace domain
	 */
	private validateSourceData(data: any): boolean {
		if (data.location) {
			return ValidationUtils.isValidLocation(data.location);
		}
		if (data.bounds) {
			return ValidationUtils.isValidBounds(data.bounds);
		}
		return true;
	}

	/**
	 * Validate target data from location services domain
	 */
	private validateTargetData(data: any): boolean {
		// Basic validation for location services data
		return (
			data &&
			ValidationUtils.isValidString(data.entityId) &&
			data.coordinates &&
			typeof data.coordinates.latitude === 'number' &&
			typeof data.coordinates.longitude === 'number'
		);
	}

	// ============================================================================
	// Marketplace → Location Services Translation
	// ============================================================================

	/**
	 * Translate marketplace vendor location update to location services format
	 */
	toLocationServicesVendorUpdate(vendorId: string, location: { lat: number; lng: number }) {
		try {
			if (!this.validateSourceData({ location })) {
				throw new Error('Invalid vendor location data');
			}

			const result = {
				entityId: vendorId, // Location Services uses 'entityId'
				coordinates: TransformationUtils.transformLocationToLatLng(location),
				trackingStatus: 'active',
				accuracy: 5.0, // Default accuracy
				lastUpdateTime: new Date().toISOString(),
				source: 'marketplace',
			};

			return result;
		} catch (error) {
			this.logger.error('Failed to translate vendor location update', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace user location update to location services format
	 */
	toLocationServicesUserUpdate(userId: string, location: { lat: number; lng: number }) {
		try {
			if (!this.validateSourceData({ location })) {
				throw new Error('Invalid user location data');
			}

			const result = {
				entityId: userId, // Location Services uses 'entityId'
				coordinates: TransformationUtils.transformLocationToLatLng(location),
				trackingStatus: 'active',
				accuracy: 5.0, // Default accuracy
				lastUpdateTime: new Date().toISOString(),
				source: 'marketplace',
			};

			return result;
		} catch (error) {
			this.logger.error('Failed to translate user location update', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace location bounds to location services format
	 */
	toLocationServicesBounds(bounds: MarketplaceLocationBounds) {
		try {
			if (!this.validateSourceData({ bounds })) {
				throw new Error('Invalid bounds data');
			}

			const result = TransformationUtils.transformBounds({
				southWest: bounds.swLocation,
				northEast: bounds.neLocation,
			});

			return result;
		} catch (error) {
			this.logger.error('Failed to translate location bounds', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace radius search to location services format
	 */
	toLocationServicesRadiusSearch(center: { lat: number; lng: number }, radiusInMeters: number) {
		try {
			if (!this.validateSourceData({ location: center })) {
				throw new Error('Invalid center location data');
			}

			const result = {
				center: TransformationUtils.transformLocationToLatLng(center),
				radiusInMeters,
				entityType: 'vendor', // Location Services needs to know entity type
			};

			return result;
		} catch (error) {
			this.logger.error('Failed to translate radius search', error);
			throw error;
		}
	}

	// ============================================================================
	// Location Services → Marketplace Translation
	// ============================================================================
}

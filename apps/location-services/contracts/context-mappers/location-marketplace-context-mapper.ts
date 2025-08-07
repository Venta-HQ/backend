import { ValidationUtils } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Location Services → Marketplace Context Mapper
 *
 * Translates data between Location Services and Marketplace domains
 */
@Injectable()
export class LocationMarketplaceContextMapper {
	private readonly logger = new Logger('LocationMarketplaceContextMapper');

	/**
	 * Validate location data
	 */
	private validateLocationData(data: any): boolean {
		return (
			data &&
			typeof data.latitude === 'number' &&
			typeof data.longitude === 'number' &&
			typeof data.timestamp === 'string'
		);
	}

	/**
	 * Validate location request
	 */
	private validateLocationRequest(data: any): boolean {
		return data && typeof data.lat === 'number' && typeof data.lng === 'number';
	}

	/**
	 * Validate proximity results
	 */
	private validateProximityResults(data: any[]): boolean {
		return (
			Array.isArray(data) &&
			data.every(
				(item) =>
					item &&
					typeof item.entityId === 'string' &&
					typeof item.distance === 'number' &&
					item.coordinates &&
					typeof item.coordinates.latitude === 'number' &&
					typeof item.coordinates.longitude === 'number',
			)
		);
	}

	/**
	 * Translate location services user location to marketplace format
	 */
	toMarketplaceUserLocation(
		userId: string,
		locationData: {
			latitude: number;
			longitude: number;
			timestamp: string;
			accuracy?: number;
		},
	) {
		try {
			// Validate source data
			if (!userId || !this.validateLocationData(locationData)) {
				throw new Error('Invalid user location data');
			}

			// Transform to marketplace format
			const marketplaceLocation = {
				userId,
				location: {
					lat: locationData.latitude,
					lng: locationData.longitude,
				},
				lastUpdated: locationData.timestamp,
				accuracy: locationData.accuracy || null,
			};

			return marketplaceLocation;
		} catch (error) {
			this.logger.error('Failed to translate user location', error);
			throw error;
		}
	}

	/**
	 * Translate location services vendor location to marketplace format
	 */
	toMarketplaceVendorLocation(
		vendorId: string,
		locationData: {
			latitude: number;
			longitude: number;
			timestamp: string;
			status: string;
		},
	) {
		try {
			// Validate source data
			if (!vendorId || !this.validateLocationData(locationData)) {
				throw new Error('Invalid vendor location data');
			}

			// Transform to marketplace format
			const marketplaceLocation = {
				vendorId,
				location: {
					lat: locationData.latitude,
					lng: locationData.longitude,
				},
				lastUpdated: locationData.timestamp,
				isActive: locationData.status === 'active',
			};

			return marketplaceLocation;
		} catch (error) {
			this.logger.error('Failed to translate vendor location', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace location request to location services format
	 */
	toLocationServicesLocationRequest(
		entityId: string,
		entityType: 'user' | 'vendor',
		locationRequest: {
			lat: number;
			lng: number;
			radius?: number;
		},
	) {
		try {
			// Validate source data
			if (!entityId || !entityType || !this.validateLocationRequest(locationRequest)) {
				throw new Error('Invalid location request data');
			}

			// Transform to location services format
			const locationServicesRequest = {
				entityId,
				entityType,
				coordinates: {
					latitude: locationRequest.lat,
					longitude: locationRequest.lng,
				},
				radius: locationRequest.radius || 1000, // Default 1km radius
				timestamp: new Date().toISOString(),
			};

			return locationServicesRequest;
		} catch (error) {
			this.logger.error('Failed to translate location request', error);
			throw error;
		}
	}

	/**
	 * Translate location services proximity results to marketplace format
	 */
	toMarketplaceProximityResults(
		results: {
			entityId: string;
			distance: number;
			coordinates: { latitude: number; longitude: number };
		}[],
	) {
		try {
			// Validate source data
			if (!this.validateProximityResults(results)) {
				throw new Error('Invalid proximity results data');
			}

			// Transform to marketplace format
			const marketplaceResults = results.map((result) => ({
				id: result.entityId,
				distance: result.distance,
				location: {
					lat: result.coordinates.latitude,
					lng: result.coordinates.longitude,
				},
			}));

			return marketplaceResults;
		} catch (error) {
			this.logger.error('Failed to translate proximity results', error);
			throw error;
		}
	}
}

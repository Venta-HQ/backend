import { Injectable, Logger } from '@nestjs/common';
import { LocationMarketplaceMapping, LocationUpdateEvent, UserLocationData, VendorLocationData } from '../types';

/**
 * Location to Marketplace Context Mapper
 *
 * Translates location domain data structures to marketplace domain data structures.
 * This is a directional mapper - it only handles location -> marketplace translations.
 */
@Injectable()
export class LocationToMarketplaceContextMapper {
	private readonly logger = new Logger(LocationToMarketplaceContextMapper.name);

	/**
	 * Maps vendor location data to marketplace format
	 */
	toMarketplaceVendorLocation(
		vendorData: VendorLocationData,
		locationVendorId: string,
	): LocationMarketplaceMapping['vendorLocation'] {
		this.logger.debug('Mapping vendor location data to marketplace format', {
			vendorId: vendorData.vendorId,
			locationVendorId,
			coordinates: vendorData.location,
		});

		return {
			locationVendorId,
			marketplaceVendorId: vendorData.vendorId,
			locationCoordinates: {
				lat: vendorData.location.lat,
				lng: vendorData.location.lng,
			},
			locationDomain: 'vendor_location',
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Maps user location data to marketplace format
	 */
	toMarketplaceUserLocation(
		userData: UserLocationData,
		locationUserId: string,
	): LocationMarketplaceMapping['userLocation'] {
		this.logger.debug('Mapping user location data to marketplace format', {
			userId: userData.userId,
			locationUserId,
			coordinates: userData.location,
		});

		return {
			locationUserId,
			marketplaceUserId: userData.userId,
			locationCoordinates: {
				lat: userData.location.lat,
				lng: userData.location.lng,
			},
			locationDomain: 'user_location',
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Maps location update event to marketplace format
	 */
	toMarketplaceLocationUpdate(
		event: LocationUpdateEvent,
	): LocationMarketplaceMapping['vendorLocation'] | LocationMarketplaceMapping['userLocation'] {
		this.logger.debug('Mapping location update event to marketplace format', {
			entityId: event.entityId,
			entityType: event.entityType,
			coordinates: event.location,
		});

		const baseMapping = {
			locationCoordinates: {
				lat: event.location.lat,
				lng: event.location.lng,
			},
			timestamp: event.timestamp,
		};

		if (event.entityType === 'vendor') {
			return {
				...baseMapping,
				locationVendorId: event.entityId,
				marketplaceVendorId: event.entityId,
				locationDomain: 'vendor_location',
			};
		} else {
			return {
				...baseMapping,
				locationUserId: event.entityId,
				marketplaceUserId: event.entityId,
				locationDomain: 'user_location',
			};
		}
	}
}

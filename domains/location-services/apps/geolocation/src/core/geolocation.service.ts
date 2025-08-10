import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { GeospatialQueryACL, LocationUpdateACL } from '@venta/domains/location-services/contracts';
import type {
	GeospatialQuery,
	LocationResult,
	LocationUpdate,
} from '@venta/domains/location-services/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';

@Injectable()
export class GeolocationService {
	private readonly logger = new Logger(GeolocationService.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	/**
	 * Update vendor location
	 */
	async updateVendorLocation(request: LocationUpdate): Promise<void> {
		try {
			// Validate coordinates
			if (!this.isValidCoordinates(request.coordinates)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
					field: 'coordinates',
					entityId: request.entityId,
					coordinates: request.coordinates,
				});
			}

			// Update vendor location in Redis
			await this.redis.geoadd('vendor_locations', request.coordinates.lng, request.coordinates.lat, request.entityId);

			this.logger.log('Vendor location updated', {
				vendorId: request.entityId,
				coordinates: request.coordinates,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId: request.entityId,
			});

			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_vendor_location',
				entityId: request.entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Get nearby vendors based on location bounds
	 */
	async getNearbyVendors(request: GeospatialQuery): Promise<LocationResult[]> {
		try {
			// Validate coordinates using ACL
			GeospatialQueryACL.validate(request);

			// Get nearby vendors from Redis using provided center and radius
			const nearbyVendors = await this.redis.georadius(
				`${request.entityType}_locations`,
				request.center.lng,
				request.center.lat,
				request.radius,
				'm', // radius is in meters
				'WITHCOORD',
				'WITHDIST',
			);

			// Format results to match LocationResult interface
			return nearbyVendors.map(([member, distance, [lng, lat]]) => ({
				entityId: member as string,
				entityType: request.entityType,
				coordinates: {
					lat: Number(lat),
					lng: Number(lng),
				},
				distance: distance ? Number(distance) : undefined,
				lastUpdated: new Date().toISOString(),
			}));
		} catch (error) {
			this.logger.error('Failed to get nearby entities', {
				error: error instanceof Error ? error.message : 'Unknown error',
				center: request.center,
				radius: request.radius,
			});

			throw AppError.internal(ErrorCodes.ERR_QUERY_FAILED, {
				operation: 'get_nearby_entities',
				center: request.center,
				radius: request.radius,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Validate coordinates
	 */
	private isValidCoordinates(coordinates: { lat: number; lng: number }): boolean {
		return (
			coordinates &&
			typeof coordinates.lat === 'number' &&
			typeof coordinates.lng === 'number' &&
			coordinates.lat >= -90 &&
			coordinates.lat <= 90 &&
			coordinates.lng >= -180 &&
			coordinates.lng <= 180
		);
	}
}

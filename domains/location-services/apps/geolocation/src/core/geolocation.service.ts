import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { LocationServices } from '@venta/domains/location-services/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';

@Injectable()
export class GeolocationService {
	private readonly logger = new Logger(GeolocationService.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	/**
	 * Update vendor location
	 */
	async updateVendorLocation(request: LocationServices.Location.Core.LocationUpdate): Promise<void> {
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
			await this.redis.geoadd('vendor_locations', request.coordinates.long, request.coordinates.lat, request.entityId);

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
	async getNearbyVendors(
		request: LocationServices.Location.Contracts.VendorLocationRequest,
	): Promise<LocationServices.Location.Internal.VendorLocation[]> {
		try {
			// Validate coordinates
			if (!this.isValidCoordinates(request.bounds.ne) || !this.isValidCoordinates(request.bounds.sw)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
					field: 'bounds',
					bounds: request.bounds,
				});
			}

			// Calculate center point and radius
			const centerLat = (request.bounds.sw.lat + request.bounds.ne.lat) / 2;
			const centerLong = (request.bounds.sw.long + request.bounds.ne.long) / 2;
			const radius = this.calculateRadius(request.bounds);

			// Get nearby vendors from Redis
			const nearbyVendors = await this.redis.georadius(
				'vendor_locations',
				centerLong,
				centerLat,
				radius,
				'km',
				'WITHCOORD',
			);

			// Format results
			return nearbyVendors.map(([member, [long, lat]]) => ({
				vendorId: member as string,
				coordinates: {
					lat: Number(lat),
					long: Number(long),
				},
			}));
		} catch (error) {
			this.logger.error('Failed to get nearby vendors', {
				error: error instanceof Error ? error.message : 'Unknown error',
				bounds: request.bounds,
			});

			throw AppError.internal(ErrorCodes.ERR_QUERY_FAILED, {
				operation: 'get_nearby_vendors',
				bounds: request.bounds,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Calculate radius in kilometers between two points
	 */
	private calculateRadius(bounds: LocationServices.Location.Internal.LocationBounds): number {
		const lat1 = (bounds.sw.lat * Math.PI) / 180;
		const lat2 = (bounds.ne.lat * Math.PI) / 180;
		const lon1 = (bounds.sw.long * Math.PI) / 180;
		const lon2 = (bounds.ne.long * Math.PI) / 180;

		const R = 6371; // Earth's radius in kilometers
		const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
		const y = lat2 - lat1;
		const d = Math.sqrt(x * x + y * y) * R;

		return d / 2; // Return half the diagonal distance as radius
	}

	/**
	 * Validate coordinates
	 */
	private isValidCoordinates(coordinates: LocationServices.Location.Internal.Coordinates): boolean {
		return (
			coordinates &&
			typeof coordinates.lat === 'number' &&
			typeof coordinates.long === 'number' &&
			coordinates.lat >= -90 &&
			coordinates.lat <= 90 &&
			coordinates.long >= -180 &&
			coordinates.long <= 180
		);
	}
}

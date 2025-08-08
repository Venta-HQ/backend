import Redis from 'ioredis';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { LocationServices } from '@domains/location-services/contracts/types/context-mapping.types';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { LocationTrackingService } from './location-tracking.service';

@Injectable()
export class GeolocationService {
	private readonly logger = new Logger(GeolocationService.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly locationTrackingService: LocationTrackingService,
	) {}

	async updateVendorLocation(request: LocationServices.Contracts.LocationUpdate) {
		this.logger.debug('Processing vendor location update', {
			entityId: request.entityId,
			coordinates: request.coordinates,
		});

		try {
			// Validate coordinates
			if (!this.locationTrackingService.validateCoordinates(request.coordinates)) {
				throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
					operation: 'validate_coordinates',
					coordinates: request.coordinates,
				});
			}

			// Update vendor location in Redis
			await this.redis.geoadd('vendor_locations', request.coordinates.lng, request.coordinates.lat, request.entityId);

			// Update vendor status
			await this.locationTrackingService.updateVendorStatus(request.entityId, {
				coordinates: request.coordinates,
				timestamp: new Date().toISOString(),
			});

			this.logger.debug('Successfully updated vendor location', {
				entityId: request.entityId,
				coordinates: request.coordinates,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error instanceof Error ? error.message : 'Unknown error',
				entityId: request.entityId,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_LOC_UPDATE, {
				operation: 'update_vendor_location',
				entityId: request.entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async getNearbyVendors(
		request: LocationServices.Contracts.GeospatialQuery,
	): Promise<LocationServices.Core.VendorLocation[]> {
		this.logger.debug('Processing nearby vendors request', {
			bounds: request.bounds,
			limit: request.limit,
		});

		try {
			// Validate coordinates
			if (
				!this.locationTrackingService.validateCoordinates(request.bounds.sw) ||
				!this.locationTrackingService.validateCoordinates(request.bounds.ne)
			) {
				throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
					operation: 'validate_coordinates',
					bounds: request.bounds,
				});
			}

			const centerLat = (request.bounds.sw.lat + request.bounds.ne.lat) / 2;
			const centerLng = (request.bounds.sw.lng + request.bounds.ne.lng) / 2;
			const radius = this.calculateRadius(request.bounds);

			// Get nearby vendor IDs from Redis
			const nearbyVendors = await this.redis.georadius(
				'vendor_locations',
				centerLng.toString(),
				centerLat.toString(),
				radius.toString(),
				'km',
				'WITHCOORD',
				...(request.limit ? ['COUNT', request.limit.toString()] : []),
			);

			// Get vendor statuses
			const vendorStatuses = await Promise.all(
				nearbyVendors.map(async ([member, [lng, lat]]) => {
					const status = await this.locationTrackingService.getVendorStatus(member);
					return {
						entityId: member,
						coordinates: {
							lat: Number(lat),
							lng: Number(lng),
						},
						updatedAt: status.lastUpdate,
						isActive: status.isActive,
					};
				}),
			);

			return request.activeOnly ? vendorStatuses.filter((status) => status.isActive) : vendorStatuses;
		} catch (error) {
			this.logger.error('Failed to get nearby vendors', {
				error: error instanceof Error ? error.message : 'Unknown error',
				bounds: request.bounds,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_LOC_QUERY, {
				operation: 'get_nearby_vendors',
				bounds: request.bounds,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	private calculateRadius(bounds: LocationServices.Core.GeospatialBounds): number {
		const R = 6371; // Earth's radius in km
		const lat1 = (bounds.sw.lat * Math.PI) / 180;
		const lat2 = (bounds.ne.lat * Math.PI) / 180;
		const lon1 = (bounds.sw.lng * Math.PI) / 180;
		const lon2 = (bounds.ne.lng * Math.PI) / 180;

		const dLat = lat2 - lat1;
		const dLon = lon2 - lon1;

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const d = R * c;

		// Return diagonal distance of the bounding box
		return d / 2; // Divide by 2 to get radius from center
	}
}

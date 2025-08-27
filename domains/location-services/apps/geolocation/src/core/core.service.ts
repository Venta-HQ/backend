import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import type { LocationResult, LocationUpdate } from '@venta/domains/location-services/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { EventService, Logger, PrometheusService } from '@venta/nest/modules';

type RedisGeosearchResult = Array<[string, string | undefined, [string | number, string | number]]>;

@Injectable()
export class CoreService {
	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly eventService: EventService,
		private readonly logger: Logger,
		private readonly prometheus: PrometheusService,
	) {
		this.logger.setContext(CoreService.name);
	}

	/**
	 * Update vendor location
	 */
	async updateVendorLocation(request: LocationUpdate): Promise<void> {
		try {
			// Update vendor location in Redis
			await this.redis.geoadd('vendor_locations', request.coordinates.lng, request.coordinates.lat, request.entityId);

			this.eventService.emit('location.vendor.location_updated', {
				vendorId: request.entityId,
				location: request.coordinates,
			});

			this.logger.debug('Vendor location updated', {
				vendorId: request.entityId,
				coordinates: request.coordinates,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', error instanceof Error ? error.stack : undefined, {
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
	async getNearbyVendors(center: { lat: number; lng: number }, radius: number): Promise<LocationResult[]> {
		const histogramName = 'redis_geosearch_duration_seconds';
		if (!this.prometheus.hasMetric(histogramName)) {
			this.prometheus.registerMetrics([
				{
					name: histogramName,
					help: 'Redis GEOSEARCH duration',
					buckets: [0.005, 0.01, 0.05, 0.1, 0.5],
					type: 'histogram',
				},
			]);
		}
		const histogram = this.prometheus.getMetric(histogramName) as any;
		const endTimer = histogram.startTimer();
		try {
			// Get nearby vendors using GEOSEARCH (GEORADIUS is deprecated in Redis 7+)
			const nearbyVendors = (await this.redis.geosearch(
				'vendor_locations',
				'FROMLONLAT',
				center.lng,
				center.lat,
				'BYRADIUS',
				radius,
				'm', // radius is in meters
				'WITHCOORD',
				'WITHDIST',
			)) as RedisGeosearchResult;

			// Format results to match LocationResult interface
			return nearbyVendors.map(([member, distance, [lng, lat]]) => ({
				entityId: member as string,
				coordinates: {
					lat: Number(lat),
					lng: Number(lng),
				},
				distance: distance ? Number(distance) : undefined,
			}));
		} catch (error) {
			this.logger.error('Failed to get nearby entities', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				center,
				radius,
			});

			throw AppError.internal(ErrorCodes.ERR_QUERY_FAILED, {
				operation: 'get_nearby_entities',
				center,
				radius,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			endTimer();
		}
	}

	/* removed unused isValidCoordinates */
}

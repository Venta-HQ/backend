import { Redis } from 'ioredis';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { LocationExternalServiceACL } from '@domains/location-services/contracts/anti-corruption-layers/location-external-service-acl';
import { LocationToMarketplaceContextMapper } from '@domains/location-services/contracts/context-mappers/location-to-marketplace-context-mapper';
import { LocationServices } from '@domains/location-services/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Geolocation service for location services domain
 */
@Injectable()
export class GeolocationService {
	private readonly logger = new Logger(GeolocationService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly redis: Redis,
		private readonly locationACL: LocationExternalServiceACL,
		private readonly contextMapper: LocationToMarketplaceContextMapper,
	) {}

	/**
	 * Update vendor location in Redis geospatial store
	 */
	async updateVendorLocation(request: LocationServices.Contracts.LocationUpdate): Promise<void> {
		this.logger.debug('Processing vendor location update', {
			entityId: request.entityId,
			coordinates: request.coordinates,
		});

		try {
			// Validate request
			if (!this.locationACL.validateLocationUpdate(request as unknown)) {
				throw AppError.validation('INVALID_INPUT', 'Invalid location update data', {
					entityId: request.entityId,
				});
			}

			// Validate vendor exists
			const vendor = await this.prisma.db.vendor.findUnique({
				where: { id: request.entityId },
			});

			if (!vendor) {
				throw AppError.notFound('VENDOR_NOT_FOUND', 'Vendor not found', {
					vendorId: request.entityId,
				});
			}

			// Convert to Redis format
			const geoMember = this.locationACL.toRedisMember(request.entityId, request.coordinates);

			// Update Redis geospatial store with retry
			await retryOperation(
				async () => {
					await this.redis.geoadd('vendor_locations', geoMember.longitude, geoMember.latitude, geoMember.key);
				},
				'Update vendor location in Redis',
				{ logger: this.logger },
			);

			// Update vendor in database
			await this.prisma.db.vendor.update({
				where: { id: request.entityId },
				data: {
					lat: request.coordinates.lat,
					long: request.coordinates.lng,
					updatedAt: new Date(),
				},
			});

			// Emit event
			const event: LocationServices.Events.LocationUpdated = {
				entityId: request.entityId,
				coordinates: request.coordinates,
				timestamp: new Date().toISOString(),
				metadata: request.metadata,
			};

			this.logger.debug('Vendor location updated successfully', {
				entityId: request.entityId,
				coordinates: request.coordinates,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				entityId: request.entityId,
			});

			if (error instanceof AppError) throw error;
			this.locationACL.handleRedisError(error, {
				operation: 'updateVendorLocation',
				entityId: request.entityId,
			});
		}
	}

	/**
	 * Get vendors within a geographic bounding box
	 */
	async getVendorsInArea(
		request: LocationServices.Contracts.GeospatialQuery,
	): Promise<LocationServices.Core.VendorLocation[]> {
		this.logger.debug('Processing geospatial query', {
			bounds: request.bounds,
			limit: request.limit,
			activeOnly: request.activeOnly,
		});

		try {
			// Validate request
			if (!this.locationACL.validateGeospatialQuery(request as unknown)) {
				throw AppError.validation('INVALID_INPUT', 'Invalid geospatial query', {
					bounds: request.bounds,
				});
			}

			// Get vendor IDs within bounds using Redis geospatial query
			const vendorIds = await retryOperation(
				async () => {
					return this.redis.georadius(
						'vendor_locations',
						request.bounds.ne.lng,
						request.bounds.ne.lat,
						'5000', // 5km radius
						'km',
						'WITHCOORD',
						'WITHDIST',
						'COUNT',
						request.limit || 100,
					);
				},
				'Get vendors in area from Redis',
				{ logger: this.logger },
			);

			if (!vendorIds?.length) {
				return [];
			}

			// Get vendor details from database
			const vendors = await this.prisma.db.vendor.findMany({
				where: {
					id: {
						in: vendorIds.map((v: any) => v[0]),
					},
					...(request.activeOnly && { open: true }),
				},
				select: {
					id: true,
					lat: true,
					long: true,
					open: true,
					updatedAt: true,
				},
			});

			// Convert to domain format
			return vendors.map((vendor) => ({
				entityId: vendor.id,
				coordinates: {
					lat: vendor.lat || 0,
					lng: vendor.long || 0,
				},
				updatedAt: vendor.updatedAt.toISOString(),
				isActive: vendor.open,
			}));
		} catch (error) {
			this.logger.error('Failed to get vendors in area', {
				error: error.message,
				bounds: request.bounds,
			});

			if (error instanceof AppError) throw error;
			this.locationACL.handleRedisError(error, {
				operation: 'getVendorsInArea',
				bounds: request.bounds,
			});
		}
	}
}

import { Redis } from 'ioredis';
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { Location, LocationUpdate, VendorLocation } from '@app/proto/location-services/geolocation';
import { retryOperation } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

interface GeospatialBounds {
	neBounds: Location;
	swBounds: Location;
}

@Injectable()
export class GeolocationService {
	private readonly logger = new Logger(GeolocationService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly redis: Redis,
	) {}

	/**
	 * Update vendor location in Redis geospatial store
	 * Domain method for vendor location management
	 */
	async updateVendorLocation(data: LocationUpdate): Promise<void> {
		if (!data.location) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_COORDINATES, 'Location data is required', {
				entityId: data.entityId,
				operation: 'update_vendor_location',
			});
		}

		this.logger.log('Updating vendor location in geospatial store', {
			location: `${data.location.lat}, ${data.location.long}`,
			vendorId: data.entityId,
		});

		try {
			// Validate vendor exists
			const vendor = await this.prisma.db.vendor.findUnique({
				where: { id: data.entityId },
			});

			if (!vendor) {
				throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.VENDOR_NOT_FOUND, 'Vendor not found', {
					vendorId: data.entityId,
				});
			}

			// Update Redis geospatial store with retry
			await retryOperation(
				async () => {
					await this.redis.geoadd('vendor_locations', data.location!.long, data.location!.lat, data.entityId);
				},
				'Update vendor location in Redis',
				{ logger: this.logger },
			);

			this.logger.log('Vendor location updated successfully', {
				location: `${data.location.lat}, ${data.location.long}`,
				vendorId: data.entityId,
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			this.logger.error('Failed to update vendor location', {
				error,
				location: data.location,
				vendorId: data.entityId,
			});
			throw new AppError(
				ErrorType.EXTERNAL_SERVICE,
				ErrorCodes.LOCATION_REDIS_OPERATION_FAILED,
				'Failed to update vendor location',
				{
					entityId: data.entityId,
					operation: 'update_vendor_location',
				},
			);
		}
	}

	/**
	 * Get vendors within a geographic bounding box
	 * Uses Redis geospatial queries for efficient lookup
	 */
	async getVendorsInArea(bounds: GeospatialBounds): Promise<VendorLocation[]> {
		this.logger.log('Getting vendors in geographic area', {
			neBounds: `${bounds.neBounds.lat}, ${bounds.neBounds.long}`,
			swBounds: `${bounds.swBounds.lat}, ${bounds.swBounds.long}`,
		});

		try {
			// Get vendor IDs within bounds using Redis geospatial query
			const vendorIds = await retryOperation(
				async () => {
					return this.redis.georadius(
						'vendor_locations',
						bounds.neBounds.long,
						bounds.neBounds.lat,
						'5000', // 5km radius
						'km',
						'WITHCOORD',
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
				},
				select: {
					id: true,
					location: true,
				},
			});

			return vendors.map((vendor) => ({
				id: vendor.id,
				location: {
					lat: vendor.location.coordinates.latitude,
					long: vendor.location.coordinates.longitude,
				},
			}));
		} catch (error) {
			this.logger.error('Failed to get vendors in area', {
				bounds,
				error,
			});
			throw new AppError(
				ErrorType.EXTERNAL_SERVICE,
				ErrorCodes.LOCATION_REDIS_OPERATION_FAILED,
				'Failed to get vendors in area',
				{
					bounds,
					operation: 'get_vendors_in_area',
				},
			);
		}
	}
}

import Redis from 'ioredis';
import { z } from 'zod';
import { GrpcLocationUpdateSchema, GrpcVendorLocationRequestSchema } from '@app/apitypes';
import { LocationDomainError, LocationDomainErrorCodes } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

// Type definitions for the service
type LocationUpdate = z.infer<typeof GrpcLocationUpdateSchema>;
type VendorLocationRequest = z.infer<typeof GrpcVendorLocationRequestSchema>;
type VendorLocationResponse = { vendors: Array<{ id: string; location: { lat: number; long: number } }> };

interface LocationData {
	lat: number;
	long: number;
}

@Injectable()
export class LocationService {
	private readonly logger = new Logger(LocationService.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
	) {}

	/**
	 * Update vendor location in Redis geospatial store and publish event
	 * Domain method for vendor location management
	 */
	async updateVendorLocation(data: LocationUpdate): Promise<void> {
		if (!data.location) {
			throw new LocationDomainError(LocationDomainErrorCodes.INVALID_COORDINATES, 'Location data is required', {
				entityId: data.entityId,
				operation: 'update_vendor_location',
			});
		}

		this.logger.log('Updating vendor location in geospatial store', {
			location: `${data.location.lat}, ${data.location.long}`,
			vendorId: data.entityId,
		});

		try {
			// Update Redis geospatial store with retry
			await retryOperation(
				async () => {
					await this.redis.geoadd('vendor_locations', data.location!.long, data.location!.lat, data.entityId);
				},
				'Update vendor location in Redis',
				{ logger: this.logger },
			);

			// Publish location update event for vendor management to handle
			await this.eventService.emit('vendor.location.updated', {
				location: {
					lat: data.location.lat,
					long: data.location.long,
				},
				timestamp: new Date(),
				vendorId: data.entityId,
			});

			this.logger.log('Vendor location updated successfully', {
				location: `${data.location.lat}, ${data.location.long}`,
				vendorId: data.entityId,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error,
				location: data.location,
				vendorId: data.entityId,
			});
			throw new LocationDomainError(
				LocationDomainErrorCodes.REDIS_OPERATION_FAILED,
				'Failed to update vendor location',
				{
					entityId: data.entityId,
					operation: 'update_vendor_location',
				},
			);
		}
	}

	/**
	 * Update user location in Redis geospatial store
	 * Domain method for user location management
	 */
	async updateUserLocation(data: LocationUpdate): Promise<void> {
		if (!data.location) {
			throw new LocationDomainError(LocationDomainErrorCodes.INVALID_COORDINATES, 'Location data is required', {
				entityId: data.entityId,
				operation: 'update_user_location',
			});
		}

		this.logger.log('Updating user location in geospatial store', {
			location: `${data.location.lat}, ${data.location.long}`,
			userId: data.entityId,
		});

		try {
			// Update Redis geospatial store with retry
			await retryOperation(
				async () => {
					await this.redis.geoadd('user_locations', data.location!.long, data.location!.lat, data.entityId);
				},
				'Update user location in Redis',
				{ logger: this.logger },
			);

			// Publish user location update event for user management to handle
			await this.eventService.emit('user.location.updated', {
				location: {
					lat: data.location.lat,
					long: data.location.long,
				},
				timestamp: new Date(),
				userId: data.entityId,
			});

			this.logger.log('User location updated successfully', {
				location: `${data.location.lat}, ${data.location.long}`,
				userId: data.entityId,
			});
		} catch (error) {
			this.logger.error('Failed to update user location', {
				error,
				location: data.location,
				userId: data.entityId,
			});
			throw new LocationDomainError(LocationDomainErrorCodes.REDIS_OPERATION_FAILED, 'Failed to update user location', {
				entityId: data.entityId,
				operation: 'update_user_location',
			});
		}
	}

	/**
	 * Search for vendors within a bounding box
	 * Domain method for location-based vendor discovery
	 */
	async searchVendorLocations(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		const { neLocation, swLocation } = request;

		if (!neLocation || !swLocation) {
			throw new LocationDomainError(
				LocationDomainErrorCodes.INVALID_COORDINATES,
				'Bounding box coordinates are required',
				{
					operation: 'search_vendor_locations',
				},
			);
		}

		this.logger.log('Searching for vendors in bounding box', {
			neLocation: `${neLocation.lat}, ${neLocation.long}`,
			swLocation: `${swLocation.lat}, ${swLocation.long}`,
		});

		try {
			// Search for vendors in the bounding box with retry
			const vendorLocations = await retryOperation(
				async () => {
					return await this.redis.geosearch(
						'vendor_locations',
						'BYBOX',
						swLocation.long,
						swLocation.lat,
						neLocation.long,
						neLocation.lat,
						'WITHCOORD',
					);
				},
				'Search vendor locations in Redis',
				{ logger: this.logger },
			);

			const vendors = vendorLocations.map((record: unknown) => {
				const typedRecord = record as [string, [number, number]];
				return {
					id: typedRecord[0],
					location: {
						lat: typedRecord[1][1],
						long: typedRecord[1][0],
					},
				};
			});

			this.logger.log('Vendor location search completed successfully', {
				neLocation: `${neLocation.lat}, ${neLocation.long}`,
				swLocation: `${swLocation.lat}, ${swLocation.long}`,
				vendorCount: vendors.length,
			});

			return { vendors };
		} catch (error) {
			this.logger.error('Failed to search vendor locations', {
				error,
				neLocation,
				swLocation,
			});
			throw new LocationDomainError(
				LocationDomainErrorCodes.PROXIMITY_SEARCH_FAILED,
				'Failed to search vendor locations',
				{
					operation: 'search_vendor_locations',
				},
			);
		}
	}

	/**
	 * Get vendor location by ID
	 * Domain method for vendor location retrieval
	 */
	async getVendorLocation(vendorId: string): Promise<LocationData | null> {
		this.logger.log('Getting vendor location', { vendorId });

		try {
			const coordinates = await retryOperation(
				async () => {
					return await this.redis.geopos('vendor_locations', vendorId);
				},
				'Get vendor location from Redis',
				{ logger: this.logger },
			);

			if (!coordinates || !coordinates[0]) {
				this.logger.log('Vendor location not found', { vendorId });
				return null;
			}

			const [long, lat] = coordinates[0];
			const location = { lat: Number(lat), long: Number(long) };

			this.logger.log('Vendor location retrieved successfully', {
				location: `${location.lat}, ${location.long}`,
				vendorId,
			});

			return location;
		} catch (error) {
			this.logger.error('Failed to get vendor location', { error, vendorId });
			throw new LocationDomainError(LocationDomainErrorCodes.REDIS_OPERATION_FAILED, 'Failed to get vendor location', {
				operation: 'get_vendor_location',
				vendorId,
			});
		}
	}

	/**
	 * Remove vendor from geospatial store
	 * Domain method for vendor location cleanup
	 */
	async removeVendorLocation(vendorId: string): Promise<void> {
		this.logger.log('Removing vendor from geospatial store', { vendorId });

		try {
			await retryOperation(
				async () => {
					await this.redis.zrem('vendor_locations', vendorId);
				},
				'Remove vendor location from Redis',
				{ logger: this.logger },
			);

			this.logger.log('Vendor removed from geospatial store successfully', { vendorId });
		} catch (error) {
			this.logger.error('Failed to remove vendor location', { error, vendorId });
			throw new LocationDomainError(
				LocationDomainErrorCodes.REDIS_OPERATION_FAILED,
				'Failed to remove vendor location',
				{
					operation: 'remove_vendor_location',
					vendorId,
				},
			);
		}
	}
}

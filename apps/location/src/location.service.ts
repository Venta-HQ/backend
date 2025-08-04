import Redis from 'ioredis';
import { PrismaService } from '@app/nest/modules/prisma';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { IEventsService } from '@app/nest/modules/events';
import { LocationUpdate, VendorLocationRequest, VendorLocationResponse } from '@app/proto/location';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class LocationService {
	private readonly logger = new Logger(LocationService.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly prisma: PrismaService,
		private readonly eventsService: IEventsService,
	) {}

	/**
	 * Update vendor location in both Redis geospatial store and database
	 * @param data Location update data
	 * @returns Empty response
	 */
	async updateVendorLocation(data: LocationUpdate): Promise<void> {
		if (!data.location) {
			throw AppError.validation(ErrorCodes.MISSING_REQUIRED_FIELD, { field: 'location' });
		}

		try {
			// Update Redis geospatial store with retry
			await retryOperation(
				async () => {
					await this.redis.geoadd('vendor_locations', data.location!.long, data.location!.lat, data.entityId);
				},
				'Update vendor location in Redis',
				{ logger: this.logger },
			);

			// Update database
			await this.prisma.db.vendor.update({
				data: {
					lat: data.location.lat,
					long: data.location.long,
				},
				where: {
					id: data.entityId,
				},
			});

			// Publish location update event
			await this.eventsService.publishEvent('vendor.location.updated', {
				vendorId: data.entityId,
				location: {
					lat: data.location.lat,
					long: data.location.long,
				},
				timestamp: new Date().toISOString(),
			});

			this.logger.log(`Updated vendor location: ${data.entityId} at (${data.location.lat}, ${data.location.long})`);
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError) {
				if (e.code === 'P2025') {
					throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: data.entityId });
				}
			}
			this.logger.error(`Failed to update vendor location for ${data.entityId}:`, e);
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update vendor location' });
		}
	}

	/**
	 * Update user location in Redis geospatial store
	 * @param data Location update data
	 * @returns Empty response
	 */
	async updateUserLocation(data: LocationUpdate): Promise<void> {
		if (!data.location) {
			throw AppError.validation(ErrorCodes.MISSING_REQUIRED_FIELD, { field: 'location' });
		}

		try {
			// Update Redis geospatial store with retry
			await retryOperation(
				async () => {
					await this.redis.geoadd('user_locations', data.location!.long, data.location!.lat, data.entityId);
				},
				'Update user location in Redis',
				{ logger: this.logger },
			);

			// Note: Database update skipped until migration is run
			await this.prisma.db.user.update({
				data: {
					lat: data.location.lat,
					long: data.location.long,
				},
				where: {
					id: data.entityId,
				},
			});

			// Publish user location update event
			await this.eventsService.publishEvent('user.location.updated', {
				userId: data.entityId,
				location: {
					lat: data.location.lat,
					long: data.location.long,
				},
				timestamp: new Date().toISOString(),
			});

			this.logger.log(`Updated user location: ${data.entityId} at (${data.location.lat}, ${data.location.long})`);
		} catch (e) {
			this.logger.error(`Failed to update user location for ${data.entityId}:`, e);
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update user location' });
		}
	}

	/**
	 * Search for vendors within a bounding box
	 * @param request Vendor location search request
	 * @returns Vendor locations within the bounding box
	 */
	async searchVendorLocations(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		const { neLocation, swLocation } = request;

		if (!neLocation || !swLocation) {
			throw AppError.validation(ErrorCodes.MISSING_REQUIRED_FIELD, { field: 'neLocation or swLocation' });
		}

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

			this.logger.log(`Found ${vendors.length} vendors in bounding box`);

			// Emit location.search.performed event
			await this.eventsService.publishEvent('location.search.performed', {
				boundingBox: {
					sw: swLocation,
					ne: neLocation,
				},
				resultCount: vendors.length,
				timestamp: new Date().toISOString(),
			});

			return { vendors };
		} catch (e) {
			this.logger.error('Failed to search vendor locations:', e);
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'GEO Search' });
		}
	}

	/**
	 * Get vendor location by ID
	 * @param vendorId Vendor ID
	 * @returns Vendor location or null
	 */
	async getVendorLocation(vendorId: string): Promise<{ lat: number; long: number } | null> {
		try {
			const coordinates = await retryOperation(
				async () => {
					return await this.redis.geopos('vendor_locations', vendorId);
				},
				'Get vendor location from Redis',
				{ logger: this.logger },
			);

			if (!coordinates || !coordinates[0]) {
				return null;
			}

			const [long, lat] = coordinates[0];
			return { lat: Number(lat), long: Number(long) };
		} catch (e) {
			this.logger.error(`Failed to get vendor location for ${vendorId}:`, e);
			return null;
		}
	}

	/**
	 * Remove vendor from geospatial store
	 * @param vendorId Vendor ID
	 */
	async removeVendorLocation(vendorId: string): Promise<void> {
		try {
			await retryOperation(
				async () => {
					await this.redis.zrem('vendor_locations', vendorId);
				},
				'Remove vendor location from Redis',
				{ logger: this.logger },
			);

			this.logger.log(`Removed vendor ${vendorId} from geospatial store`);
		} catch (e) {
			this.logger.error(`Failed to remove vendor location for ${vendorId}:`, e);
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'remove vendor location' });
		}
	}
} 
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

interface LocationData {
	accuracy?: number;
	lat: number;
	lng: number;
}

interface VendorLocation {
	distance?: number;
	id: string;
	location: LocationData;
}

interface ProximitySearchResult {
	query: {
		lat: number;
		lng: number;
		radius: number;
	};
	searchId: string;
	vendors: VendorLocation[];
}

@Injectable()
export class LocationTrackingService {
	private readonly logger = new Logger(LocationTrackingService.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
	) {}

	/**
	 * Update vendor location with domain validation and business logic
	 */
	async updateVendorLocation(vendorId: string, location: LocationData): Promise<void> {
		this.logger.log('Updating vendor location', { location, vendorId });

		// Domain validation
		await this.validateLocationData(location);
		await this.validateVendorExists(vendorId);

		// Domain logic
		await this.storeVendorLocation(vendorId, location);
		await this.updateGeolocationIndex(vendorId, location);

		// Domain events
		await this.eventService.emit('location.vendor_location_updated', {
			accuracy: location.accuracy,
			location,
			timestamp: new Date(),
			vendorId,
		});

		this.logger.log('Vendor location updated successfully', { vendorId });
	}

	/**
	 * Update user location with domain validation and business logic
	 */
	async updateUserLocation(userId: string, location: LocationData): Promise<void> {
		this.logger.log('Updating user location', { location, userId });

		// Domain validation
		await this.validateLocationData(location);
		await this.validateUserExists(userId);

		// Domain logic
		await this.storeUserLocation(userId, location);
		await this.updateUserDatabaseLocation(userId, location);

		// Domain events
		await this.eventService.emit('location.user_location_updated', {
			accuracy: location.accuracy,
			location,
			timestamp: new Date(),
			userId,
		});

		this.logger.log('User location updated successfully', { userId });
	}

	/**
	 * Find nearby vendors with domain logic and proximity alerts
	 */
	async findNearbyVendors(
		userLocation: LocationData,
		radius: number = 5000,
		userId?: string,
	): Promise<ProximitySearchResult> {
		this.logger.log('Searching for nearby vendors', { radius, userId, userLocation });

		// Domain validation
		await this.validateLocationData(userLocation);
		if (radius <= 0 || radius > 50000) {
			throw new LocationDomainError(
				LocationDomainErrorCodes.PROXIMITY_SEARCH_FAILED,
				'Search radius must be between 1 and 50,000 meters',
				{ radius },
			);
		}

		// Domain logic
		const nearbyVendors = await this.performProximitySearch(userLocation, radius);
		const searchId = this.generateSearchId();

		// Domain events
		await this.eventService.emit('location.geolocation_search_completed', {
			query: {
				lat: userLocation.lat,
				lng: userLocation.lng,
				radius,
			},
			results: nearbyVendors.map((vendor) => ({
				distance: vendor.distance || 0,
				location: vendor.location,
				vendorId: vendor.id,
			})),
			searchId,
			timestamp: new Date(),
		});

		// Proximity alerts for very close vendors
		if (userId) {
			await this.checkProximityAlerts(userId, nearbyVendors, userLocation);
		}

		this.logger.log('Nearby vendors search completed', {
			searchId,
			vendorCount: nearbyVendors.length,
		});

		return {
			query: {
				lat: userLocation.lat,
				lng: userLocation.lng,
				radius,
			},
			searchId,
			vendors: nearbyVendors,
		};
	}

	/**
	 * Get vendor location by ID with domain validation
	 */
	async getVendorLocation(vendorId: string): Promise<LocationData | null> {
		// Domain validation
		await this.validateVendorExists(vendorId);

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

			const [lng, lat] = coordinates[0];
			return { lat: Number(lat), lng: Number(lng) };
		} catch (e) {
			this.logger.error(`Failed to get vendor location for ${vendorId}:`, e);
			throw new LocationDomainError(
				LocationDomainErrorCodes.REDIS_OPERATION_FAILED,
				'Failed to retrieve vendor location',
				{ error: e, vendorId },
			);
		}
	}

	/**
	 * Remove vendor from geospatial store with domain validation
	 */
	async removeVendorLocation(vendorId: string): Promise<void> {
		this.logger.log('Removing vendor location', { vendorId });

		// Domain validation
		await this.validateVendorExists(vendorId);

		try {
			await retryOperation(
				async () => {
					await this.redis.zrem('vendor_locations', vendorId);
				},
				'Remove vendor location from Redis',
				{ logger: this.logger },
			);

			// Domain events
			await this.eventService.emit('location.vendor_location_removed', {
				timestamp: new Date(),
				vendorId,
			});

			this.logger.log('Vendor location removed successfully', { vendorId });
		} catch (e) {
			this.logger.error(`Failed to remove vendor location for ${vendorId}:`, e);
			throw new LocationDomainError(
				LocationDomainErrorCodes.REDIS_OPERATION_FAILED,
				'Failed to remove vendor location',
				{ error: e, vendorId },
			);
		}
	}

	/**
	 * Validate location coordinates according to domain rules
	 */
	private async validateLocationData(location: LocationData): Promise<void> {
		if (location.lat < -90 || location.lat > 90) {
			throw new LocationDomainError(LocationDomainErrorCodes.INVALID_LATITUDE, 'Invalid latitude value', {
				lat: location.lat,
			});
		}

		if (location.lng < -180 || location.lng > 180) {
			throw new LocationDomainError(LocationDomainErrorCodes.INVALID_LONGITUDE, 'Invalid longitude value', {
				lng: location.lng,
			});
		}

		if (location.accuracy !== undefined && (location.accuracy < 0 || location.accuracy > 1000)) {
			throw new LocationDomainError(
				LocationDomainErrorCodes.INVALID_COORDINATES,
				'Location accuracy must be between 0 and 1000 meters',
				{ accuracy: location.accuracy },
			);
		}
	}

	/**
	 * Validate that vendor exists in the system
	 */
	private async validateVendorExists(vendorId: string): Promise<void> {
		const vendor = await this.prisma.db.vendor.findUnique({
			select: { id: true },
			where: { id: vendorId },
		});

		if (!vendor) {
			throw new LocationDomainError(LocationDomainErrorCodes.LOCATION_NOT_FOUND, 'Vendor not found', { vendorId });
		}
	}

	/**
	 * Validate that user exists in the system
	 */
	private async validateUserExists(userId: string): Promise<void> {
		const user = await this.prisma.db.user.findUnique({
			select: { id: true },
			where: { id: userId },
		});

		if (!user) {
			throw new LocationDomainError(LocationDomainErrorCodes.LOCATION_NOT_FOUND, 'User not found', { userId });
		}
	}

	/**
	 * Store vendor location in Redis geospatial store
	 */
	private async storeVendorLocation(vendorId: string, location: LocationData): Promise<void> {
		await retryOperation(
			async () => {
				await this.redis.geoadd('vendor_locations', location.lng, location.lat, vendorId);
			},
			'Update vendor location in Redis',
			{ logger: this.logger },
		);
	}

	/**
	 * Store user location in Redis geospatial store
	 */
	private async storeUserLocation(userId: string, location: LocationData): Promise<void> {
		await retryOperation(
			async () => {
				await this.redis.geoadd('user_locations', location.lng, location.lat, userId);
			},
			'Update user location in Redis',
			{ logger: this.logger },
		);
	}

	/**
	 * Update user location in database
	 */
	private async updateUserDatabaseLocation(userId: string, location: LocationData): Promise<void> {
		await this.prisma.db.user.update({
			data: {
				lat: location.lat,
				long: location.lng,
			},
			where: {
				id: userId,
			},
		});
	}

	/**
	 * Update geolocation index for search optimization
	 */
	private async updateGeolocationIndex(vendorId: string, location: LocationData): Promise<void> {
		// Additional indexing logic can be added here
		// For example, updating search indices, cache invalidation, etc.
		this.logger.debug('Geolocation index updated', { vendorId });
	}

	/**
	 * Perform proximity search using Redis geospatial queries
	 */
	private async performProximitySearch(userLocation: LocationData, radius: number): Promise<VendorLocation[]> {
		try {
			const vendorLocations = await retryOperation(
				async () => {
					return await this.redis.georadius(
						'vendor_locations',
						userLocation.lng,
						userLocation.lat,
						radius,
						'm',
						'WITHCOORD',
						'WITHDIST',
					);
				},
				'Search vendor locations in Redis',
				{ logger: this.logger },
			);

			return vendorLocations.map((record: unknown) => {
				const typedRecord = record as [string, [number, number], number];
				return {
					distance: typedRecord[2],
					id: typedRecord[0],
					location: {
						lat: typedRecord[1][1],
						lng: typedRecord[1][0],
					},
				};
			});
		} catch (e) {
			this.logger.error('Failed to perform proximity search:', e);
			throw new LocationDomainError(
				LocationDomainErrorCodes.PROXIMITY_SEARCH_FAILED,
				'Failed to search for nearby vendors',
				{ error: e },
			);
		}
	}

	/**
	 * Check for proximity alerts and emit events for very close vendors
	 */
	private async checkProximityAlerts(
		userId: string,
		vendors: VendorLocation[],
		userLocation: LocationData,
	): Promise<void> {
		const CLOSE_PROXIMITY_THRESHOLD = 100; // 100 meters

		for (const vendor of vendors) {
			if (vendor.distance && vendor.distance <= CLOSE_PROXIMITY_THRESHOLD) {
				await this.eventService.emit('location.proximity_alert', {
					distance: vendor.distance,
					location: userLocation,
					timestamp: new Date(),
					userId,
					vendorId: vendor.id,
				});

				this.logger.log('Proximity alert emitted', {
					distance: vendor.distance,
					userId,
					vendorId: vendor.id,
				});
			}
		}
	}

	/**
	 * Generate unique search ID for tracking
	 */
	private generateSearchId(): string {
		return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

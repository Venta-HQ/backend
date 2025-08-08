import { Redis } from 'ioredis';
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';
import { LocationToMarketplaceContextMapper } from '../../../contracts/context-mappers/location-to-marketplace-context-mapper';

interface LocationData {
	lat: number;
	lng: number;
}

@Injectable()
export class LocationTrackingService {
	private readonly logger = new Logger(LocationTrackingService.name);

	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
		private redis: Redis,
		private locationToMarketplaceMapper: LocationToMarketplaceContextMapper,
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

		// Transform and emit location update event
		const marketplaceLocation = this.locationToMarketplaceMapper.toMarketplaceVendorLocation(vendorId, {
			latitude: location.lat,
			longitude: location.lng,
			timestamp: new Date().toISOString(),
			status: 'active',
		});

		await this.eventService.emit('location.vendor.location_updated', {
			location: marketplaceLocation.location,
			vendorId: marketplaceLocation.vendorId,
			timestamp: marketplaceLocation.lastUpdated,
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

		// Domain logic - only handle Redis operations
		await this.storeUserLocation(userId, location);

		// Transform and emit DDD domain event with business context
		const marketplaceLocation = this.locationToMarketplaceMapper.toMarketplaceUserLocation(userId, {
			latitude: location.lat,
			longitude: location.lng,
			timestamp: new Date().toISOString(),
			accuracy: 5.0,
		});

		await this.eventService.emit('location.user.location_updated', {
			userId: marketplaceLocation.userId,
			location: marketplaceLocation.location,
			timestamp: marketplaceLocation.lastUpdated,
		});

		this.logger.log('User location updated successfully', { userId });
	}

	/**
	 * Find nearby vendors using geospatial queries
	 */
	async findNearbyVendors(userLocation: LocationData, radius: number = 5000): Promise<any[]> {
		this.logger.log('Finding nearby vendors', { userLocation, radius });

		try {
			const nearbyVendors = await this.redis.georadius(
				'vendor_locations',
				userLocation.lng,
				userLocation.lat,
				radius,
				'm',
				'WITHCOORD',
				'WITHDIST',
			);

			return this.formatNearbyVendors(nearbyVendors);
		} catch (error) {
			this.logger.error('Failed to find nearby vendors', error.stack, { error, userLocation, radius });
			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.LOCATION_PROXIMITY_SEARCH_FAILED,
				'Failed to find nearby vendors',
				{ userLocation, radius },
			);
		}
	}

	/**
	 * Store vendor location in Redis for geospatial queries
	 */
	private async storeVendorLocation(vendorId: string, location: LocationData): Promise<void> {
		try {
			await this.redis.geoadd('vendor_locations', location.lng, location.lat, vendorId);
			this.logger.log('Vendor location stored in Redis', { vendorId });
		} catch (error) {
			this.logger.error('Failed to store vendor location in Redis', error.stack, { error, vendorId });
			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.LOCATION_REDIS_OPERATION_FAILED,
				'Failed to store vendor location',
				{ vendorId, location },
			);
		}
	}

	/**
	 * Store user location in Redis for geospatial queries
	 */
	private async storeUserLocation(userId: string, location: LocationData): Promise<void> {
		try {
			await this.redis.geoadd('user_locations', location.lng, location.lat, userId);
			this.logger.log('User location stored in Redis', { userId });
		} catch (error) {
			this.logger.error('Failed to store user location in Redis', error.stack, { error, userId });
			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.LOCATION_REDIS_OPERATION_FAILED,
				'Failed to store user location',
				{ userId, location },
			);
		}
	}

	/**
	 * Validate location data
	 */
	private async validateLocationData(location: LocationData): Promise<void> {
		if (location.lat < -90 || location.lat > 90) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_COORDINATES, 'Invalid latitude value', {
				latitude: location.lat,
			});
		}
		if (location.lng < -180 || location.lng > 180) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_COORDINATES, 'Invalid longitude value', {
				longitude: location.lng,
			});
		}
	}

	/**
	 * Validate vendor exists
	 */
	private async validateVendorExists(vendorId: string): Promise<void> {
		const vendor = await this.prisma.db.vendor.findUnique({
			where: { id: vendorId },
		});

		if (!vendor) {
			throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.VENDOR_NOT_FOUND, 'Vendor not found', { vendorId });
		}
	}

	/**
	 * Validate user exists
	 */
	private async validateUserExists(userId: string): Promise<void> {
		const user = await this.prisma.db.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.USER_NOT_FOUND, 'User not found', { userId });
		}
	}

	/**
	 * Format nearby vendors from Redis response
	 */
	private formatNearbyVendors(redisResponse: any[]): any[] {
		const results = redisResponse.map((item: any) => ({
			entityId: item[0],
			distance: parseFloat(item[1]),
			coordinates: {
				latitude: parseFloat(item[2][1]),
				longitude: parseFloat(item[2][0]),
			},
		}));

		return this.locationToMarketplaceMapper.toMarketplaceProximityResults(results);
	}
}

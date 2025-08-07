import Redis from 'ioredis';
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

interface LocationData {
	lat: number;
	lng: number;
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

		// Domain events - using the existing event that's actually consumed
		await this.eventService.emit('vendor.location.updated', {
			location: {
				lat: location.lat,
				long: location.lng,
			},
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

		// Domain logic - only handle Redis operations
		await this.storeUserLocation(userId, location);

		// Domain events - let user domain handle its own database updates
		await this.eventService.emit('user.location.updated', {
			location: {
				lat: location.lat,
				long: location.lng,
			},
			timestamp: new Date(),
			userId,
		});

		this.logger.log('User location updated successfully', { userId });
	}

	/**
	 * Validate location coordinates according to domain rules
	 */
	private async validateLocationData(location: LocationData): Promise<void> {
		if (location.lat < -90 || location.lat > 90) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_LATITUDE, 'Invalid latitude value', {
				lat: location.lat,
			});
		}

		if (location.lng < -180 || location.lng > 180) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_LONGITUDE, 'Invalid longitude value', {
				lng: location.lng,
			});
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
			throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.LOCATION_NOT_FOUND, 'Vendor not found', { vendorId });
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
			throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.LOCATION_NOT_FOUND, 'User not found', { userId });
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
}

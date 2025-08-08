import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { LocationServices } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for external location services (Redis)
 * Handles validation and transformation of Redis-specific data
 */
@Injectable()
export class LocationExternalServiceACL {
	private readonly logger = new Logger(LocationExternalServiceACL.name);

	/**
	 * Validate location update request
	 */
	validateLocationUpdate(data: unknown): data is LocationServices.Contracts.LocationUpdate {
		return LocationServices.Validation.LocationUpdateSchema.safeParse(data).success;
	}

	/**
	 * Validate geospatial query request
	 */
	validateGeospatialQuery(data: unknown): data is LocationServices.Contracts.GeospatialQuery {
		return LocationServices.Validation.GeospatialQuerySchema.safeParse(data).success;
	}

	/**
	 * Convert domain coordinates to Redis geospatial member
	 */
	toRedisMember(entityId: string, coordinates: LocationServices.Core.Coordinates): LocationServices.Internal.GeoMember {
		return {
			key: entityId,
			latitude: coordinates.lat,
			longitude: coordinates.lng,
		};
	}

	/**
	 * Convert Redis geospatial member to domain vendor location
	 */
	toVendorLocation(member: LocationServices.Internal.GeoMember): LocationServices.Core.VendorLocation {
		return {
			entityId: member.key,
			coordinates: {
				lat: member.latitude,
				lng: member.longitude,
			},
			updatedAt: new Date().toISOString(),
			isActive: true,
		};
	}

	/**
	 * Convert Redis error to domain error
	 */
	handleRedisError(error: Error, context: Record<string, unknown>): never {
		this.logger.error('Redis operation failed', {
			error: error.message,
			...context,
		});

		if (error.message.includes('WRONGTYPE')) {
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', 'Invalid Redis data type', context);
		}

		if (error.message.includes('ERR')) {
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', 'Redis operation error', context);
		}

		throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', 'Unexpected Redis error', context);
	}

	/**
	 * Validate Redis geospatial member
	 */
	validateGeoMember(data: unknown): data is LocationServices.Internal.GeoMember {
		return LocationServices.Validation.GeoMemberSchema.safeParse(data).success;
	}
}

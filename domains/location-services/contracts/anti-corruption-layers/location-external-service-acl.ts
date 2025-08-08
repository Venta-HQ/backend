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
		const result = LocationServices.Validation.LocationUpdateSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation('LOCATION_INVALID_COORDINATES', ErrorCodes.LOCATION_INVALID_COORDINATES, {
				operation: 'validate_location_update',
				errors: result.error.errors,
				entityId: (data as any)?.entityId || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Validate geospatial query request
	 */
	validateGeospatialQuery(data: unknown): data is LocationServices.Contracts.GeospatialQuery {
		const result = LocationServices.Validation.GeospatialQuerySchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation('LOCATION_INVALID_COORDINATES', ErrorCodes.LOCATION_INVALID_COORDINATES, {
				operation: 'validate_geospatial_query',
				errors: result.error.errors,
				lat: (data as any)?.lat || 'undefined',
				lng: (data as any)?.lng || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Convert domain coordinates to Redis geospatial member
	 */
	toRedisMember(entityId: string, coordinates: LocationServices.Core.Coordinates): LocationServices.Internal.GeoMember {
		if (!entityId || !coordinates?.lat || !coordinates?.lng) {
			throw AppError.validation('MISSING_REQUIRED_FIELD', ErrorCodes.MISSING_REQUIRED_FIELD, {
				operation: 'to_redis_member',
				entityId: entityId || 'undefined',
				field: !entityId ? 'entityId' : !coordinates?.lat ? 'coordinates.lat' : 'coordinates.lng',
			});
		}

		return {
			key: entityId,
			latitude: coordinates.lat,
			longitude: coordinates.lng,
		};
	}

	/**
	 * Convert Redis geospatial member to domain vendor location
	 */
	toVendorLocation(member: unknown): LocationServices.Core.VendorLocation {
		const result = LocationServices.Validation.GeoMemberSchema.safeParse(member);
		if (!result.success) {
			throw AppError.validation('LOCATION_INVALID_COORDINATES', ErrorCodes.LOCATION_INVALID_COORDINATES, {
				operation: 'to_vendor_location',
				errors: result.error.errors,
				entityId: (member as any)?.key || 'undefined',
			});
		}

		return {
			entityId: result.data.key,
			coordinates: {
				lat: result.data.latitude,
				lng: result.data.longitude,
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
			error: error instanceof Error ? error.message : 'Unknown error',
			...context,
		});

		const operation = context.operation || 'redis_operation';

		if (error.message.includes('WRONGTYPE')) {
			throw AppError.internal('REDIS_OPERATION_FAILED', ErrorCodes.REDIS_OPERATION_FAILED, {
				operation,
				errorType: 'WRONGTYPE',
				...context,
			});
		}

		if (error.message.includes('ERR')) {
			throw AppError.internal('REDIS_OPERATION_FAILED', ErrorCodes.REDIS_OPERATION_FAILED, {
				operation,
				errorType: 'ERR',
				...context,
			});
		}

		throw AppError.internal('REDIS_OPERATION_FAILED', ErrorCodes.REDIS_OPERATION_FAILED, {
			operation,
			errorType: 'UNEXPECTED',
			...context,
		});
	}

	/**
	 * Validate Redis geospatial member
	 */
	validateGeoMember(data: unknown): LocationServices.Internal.GeoMember {
		const result = LocationServices.Validation.GeoMemberSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation('LOCATION_INVALID_COORDINATES', ErrorCodes.LOCATION_INVALID_COORDINATES, {
				operation: 'validate_geo_member',
				errors: result.error.errors,
				entityId: (data as any)?.key || 'undefined',
			});
		}
		return result.data;
	}
}

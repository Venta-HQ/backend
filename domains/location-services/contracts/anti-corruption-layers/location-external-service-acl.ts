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
	validateLocationUpdate(data: unknown): data is LocationServices.Location.Contracts.LocationUpdate {
		const result = LocationServices.Location.Validation.LocationUpdateSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
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
	validateGeospatialQuery(data: unknown): data is LocationServices.Location.Contracts.GeospatialQuery {
		const result = LocationServices.Location.Validation.GeospatialQuerySchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
				operation: 'validate_geospatial_query',
				errors: result.error.errors,
				lat: (data as any)?.lat || 'undefined',
				long: (data as any)?.long || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Convert domain coordinates to Redis geospatial member
	 */
	toRedisMember(
		entityId: string,
		coordinates: LocationServices.Location.Core.Coordinates,
	): LocationServices.Location.Internal.GeoMember {
		if (!entityId || !coordinates?.lat || !coordinates?.long) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_REQUIRED_FIELD, {
				operation: 'to_redis_member',
				entityId: entityId || 'undefined',
				field: !entityId ? 'entityId' : !coordinates?.lat ? 'coordinates.lat' : 'coordinates.long',
			});
		}

		return {
			key: entityId,
			latitude: coordinates.lat,
			longitude: coordinates.long,
		};
	}

	/**
	 * Convert Redis geospatial member to domain vendor location
	 */
	toVendorLocation(member: unknown): LocationServices.Location.Core.VendorLocation {
		const result = LocationServices.Location.Validation.GeoMemberSchema.safeParse(member);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
				operation: 'to_vendor_location',
				errors: result.error.errors,
				entityId: (member as any)?.key || 'undefined',
			});
		}

		return {
			entityId: result.data.key,
			coordinates: {
				lat: result.data.latitude,
				long: result.data.longitude,
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
			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation,
				errorType: 'WRONGTYPE',
				...context,
			});
		}

		if (error.message.includes('ERR')) {
			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation,
				errorType: 'ERR',
				...context,
			});
		}

		throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
			operation,
			errorType: 'UNEXPECTED',
			...context,
		});
	}

	/**
	 * Validate Redis geospatial member
	 */
	validateGeoMember(data: unknown): LocationServices.Location.Internal.GeoMember {
		const result = LocationServices.Location.Validation.GeoMemberSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
				operation: 'validate_geo_member',
				errors: result.error.errors,
				entityId: (data as any)?.key || 'undefined',
			});
		}
		return result.data;
	}
}

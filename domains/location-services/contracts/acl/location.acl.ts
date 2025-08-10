import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * Location Services ACL
 * Handles validation and transformation for location-related operations
 */

// Domain types
export interface LocationUpdate {
	entityId: string;
	entityType: 'user' | 'vendor';
	coordinates: {
		lat: number;
		lng: number;
	};
	timestamp: string;
}

export interface GeospatialQuery {
	entityType: 'user' | 'vendor';
	center: {
		lat: number;
		lng: number;
	};
	radius: number; // in meters
}

export interface LocationResult {
	entityId: string;
	entityType: 'user' | 'vendor';
	coordinates: {
		lat: number;
		lng: number;
	};
	distance?: number;
	lastUpdated: string;
}

/**
 * Location Update ACL
 * Validates and transforms location update requests
 */
export class LocationUpdateACL {
	// External → Domain (inbound)
	static validate(data: any): void {
		if (!data.entityId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'entityId',
				message: 'Entity ID is required',
			});
		}
		if (!['user', 'vendor'].includes(data.entityType)) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'entityType',
				message: 'Entity type must be user or vendor',
			});
		}
		if (!data.coordinates?.lat || !data.coordinates?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
				field: 'coordinates',
				message: 'Valid coordinates (lat, lng) are required',
			});
		}
	}

	static toDomain(data: any): LocationUpdate {
		this.validate(data);

		return {
			entityId: data.entityId,
			entityType: data.entityType,
			coordinates: {
				lat: data.coordinates.lat,
				lng: data.coordinates.lng,
			},
			timestamp: data.timestamp || new Date().toISOString(),
		};
	}

	// Domain → gRPC (outbound)
	static toGrpc(domain: LocationUpdate): {
		entityId: string;
		entityType: string;
		coordinates: { lat: number; long: number };
		timestamp: string;
	} {
		return {
			entityId: domain.entityId,
			entityType: domain.entityType,
			coordinates: {
				lat: domain.coordinates.lat,
				long: domain.coordinates.lng, // Convert lng to long for gRPC
			},
			timestamp: domain.timestamp,
		};
	}
}

/**
 * Geospatial Query ACL
 * Validates and transforms geospatial queries
 */
export class GeospatialQueryACL {
	// External → Domain (inbound)
	static validate(data: any): void {
		if (!['user', 'vendor'].includes(data.entityType)) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'entityType',
				message: 'Entity type must be user or vendor',
			});
		}
		if (!data.center?.lat || !data.center?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_COORDINATES, {
				field: 'center',
				message: 'Valid center coordinates (lat, lng) are required',
			});
		}
		if (!data.radius || data.radius <= 0) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'radius',
				message: 'Valid radius (in meters) is required',
			});
		}
	}

	static toDomain(data: any): GeospatialQuery {
		this.validate(data);

		return {
			entityType: data.entityType,
			center: {
				lat: data.center.lat,
				lng: data.center.lng,
			},
			radius: data.radius,
		};
	}
}

// Validation utilities
import {
	validateCoordinates,
	validateEntityType,
	validateRadius,
	validateRequiredString,
} from '../schemas/validation.utils';

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
		validateRequiredString(data.entityId, 'entityId');
		validateEntityType(data.entityType, 'entityType');
		validateCoordinates(data.coordinates, 'coordinates');
	}

	static toDomain(data: any): LocationUpdate {
		this.validate(data);

		const coordinates = validateCoordinates(data.coordinates, 'coordinates');

		return {
			entityId: data.entityId,
			entityType: validateEntityType(data.entityType, 'entityType'),
			coordinates,
			timestamp: data.timestamp || new Date().toISOString(),
		};
	}

	// Domain → gRPC (outbound)
	static toGrpc(domain: LocationUpdate): {
		entityId: string;
		entityType: string;
		coordinates: { lat: number; lng: number };
		timestamp: string;
	} {
		return {
			entityId: domain.entityId,
			entityType: domain.entityType,
			coordinates: {
				lat: domain.coordinates.lat,
				lng: domain.coordinates.lng,
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
		validateEntityType(data.entityType, 'entityType');
		validateCoordinates(data.center, 'center');
		validateRadius(data.radius, 'radius');
	}

	static toDomain(data: any): GeospatialQuery {
		this.validate(data);

		const center = validateCoordinates(data.center, 'center');

		return {
			entityType: validateEntityType(data.entityType, 'entityType'),
			center,
			radius: validateRadius(data.radius, 'radius'),
		};
	}
}

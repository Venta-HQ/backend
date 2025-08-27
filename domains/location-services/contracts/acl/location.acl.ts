// Validation utilities
import { validateSchema } from '@venta/utils';
import { grpcGeospatialQuerySchema, grpcLocationUpdateSchema } from '../schemas/location.schemas';
// WebSocket types - only need types now since validation is handled by SchemaValidatorPipe
import type { UserLocationUpdateRequest, VendorLocationUpdateRequest } from '../schemas/websocket.schemas';
// Domain types (what gRPC maps to)
import type { GeospatialQuery, LocationUpdate } from '../types/domain';

// gRPC types (wire format) - from proto when available
// For now, we'll define them here until proto types are available
interface GrpcLocationUpdateData {
	entityId: string;
	entityType: 'user' | 'vendor';
	coordinates: {
		lat: number;
		lng: number;
	};
	timestamp?: string;
}

interface GrpcGeospatialQueryData {
	entityType: 'user' | 'vendor';
	center: {
		lat: number;
		lng: number;
	};
	radius: number;
}

// ============================================================================
// LOCATION ACL - Multi-protocol validation and transformation
// ============================================================================

/**
 * Location Update ACL (gRPC)
 * Handles validation and transformation for gRPC location updates
 */
export class LocationUpdateACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: GrpcLocationUpdateData): void {
		validateSchema(grpcLocationUpdateSchema, grpc);
	}

	static toDomain(grpc: GrpcLocationUpdateData): LocationUpdate {
		this.validateIncoming(grpc);

		return {
			entityId: grpc.entityId,
			entityType: grpc.entityType,
			coordinates: {
				lat: grpc.coordinates.lat,
				lng: grpc.coordinates.lng,
			},
			timestamp: grpc.timestamp || new Date().toISOString(),
		};
	}
}

/**
 * User Location Update ACL (WebSocket)
 * Handles transformation for user location updates from WebSocket
 * Validation handled by SchemaValidatorPipe
 */
export class UserLocationUpdateACL {
	// WebSocket → Domain (inbound)
	static toDomain(wsData: UserLocationUpdateRequest, entityId: string): LocationUpdate {
		return {
			entityId,
			entityType: 'user',
			coordinates: {
				lat: wsData.lat,
				lng: wsData.lng,
			},
			timestamp: new Date().toISOString(),
		};
	}
}

/**
 * Vendor Location Update ACL (WebSocket)
 * Handles transformation for vendor location updates from WebSocket
 * Validation handled by SchemaValidatorPipe
 */
export class VendorLocationUpdateACL {
	// WebSocket → Domain (inbound)
	static toDomain(wsData: VendorLocationUpdateRequest, entityId: string): LocationUpdate {
		return {
			entityId,
			entityType: 'vendor',
			coordinates: {
				lat: wsData.lat,
				lng: wsData.lng,
			},
			timestamp: new Date().toISOString(),
		};
	}
}

/**
 * Geospatial Query ACL
 * Bidirectional validation and transformation for geospatial query operations
 */
export class GeospatialQueryACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: GrpcGeospatialQueryData): void {
		validateSchema(grpcGeospatialQuerySchema, grpc);
	}

	static toDomain(grpc: GrpcGeospatialQueryData): GeospatialQuery {
		this.validateIncoming(grpc);

		return {
			entityType: grpc.entityType,
			center: {
				lat: grpc.center.lat,
				lng: grpc.center.lng,
			},
			radius: grpc.radius,
		};
	}
}

import {
	LocationUpdate as GrpcLocationUpdate,
	VendorLocationRequest,
} from '@venta/proto/location-services/geolocation';
import { validateSchema } from '@venta/utils';
import { grpcGeospatialQuerySchema, grpcLocationUpdateSchema } from '../schemas/location.schemas';
import { validateCoordinates } from '../schemas/validation.utils';
import {
	userLocationUpdateSchema,
	vendorLocationUpdateSchema,
	type UserLocationUpdateRequest,
	type VendorLocationUpdateRequest,
} from '../schemas/websocket.schemas';
import type { GeospatialQuery, LocationUpdate } from '../types/domain';

// ============================================================================
// LOCATION ACL - Multi-protocol validation and transformation
// ============================================================================

/**
 * Location Update ACL (gRPC)
 * Handles validation and transformation for gRPC location updates
 */
export class LocationUpdateACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: GrpcLocationUpdate): void {
		validateSchema(grpcLocationUpdateSchema, grpc);
		validateCoordinates(grpc.coordinates);
	}

	static toDomain(grpc: GrpcLocationUpdate): LocationUpdate {
		this.validateIncoming(grpc);

		return {
			entityId: grpc.entityId,
			coordinates: {
				lat: grpc.coordinates.lat,
				lng: grpc.coordinates.lng,
			},
		};
	}
}

/**
 * Geospatial Query ACL
 * Bidirectional validation and transformation for geospatial query operations
 */
export class GeospatialQueryACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: VendorLocationRequest): void {
		validateSchema(grpcGeospatialQuerySchema, grpc);
	}

	static toDomain(grpc: VendorLocationRequest): GeospatialQuery {
		this.validateIncoming(grpc);

		return {
			ne: {
				lat: grpc.ne.lat,
				lng: grpc.ne.lng,
			},
			sw: {
				lat: grpc.sw.lat,
				lng: grpc.sw.lng,
			},
		};
	}
}

/**
 * WebSocket → Domain ACLs for location updates
 */
export class UserLocationUpdateACL {
	static validateIncoming(ws: UserLocationUpdateRequest): void {
		validateSchema(userLocationUpdateSchema, ws);
	}

	static toDomain(ws: UserLocationUpdateRequest, userId: string): LocationUpdate {
		this.validateIncoming(ws);
		return {
			entityId: userId,
			coordinates: { lat: ws.lat, lng: ws.lng },
		};
	}
}

export class VendorLocationUpdateACL {
	static validateIncoming(ws: VendorLocationUpdateRequest): void {
		validateSchema(vendorLocationUpdateSchema, ws);
	}

	static toDomain(ws: VendorLocationUpdateRequest, vendorId: string): LocationUpdate {
		this.validateIncoming(ws);
		return {
			entityId: vendorId,
			coordinates: { lat: ws.lat, lng: ws.lng },
		};
	}
}

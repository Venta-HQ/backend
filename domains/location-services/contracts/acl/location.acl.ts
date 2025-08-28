import { EventDataMap, locationEventSchemas } from '@venta/eventtypes';
import { VendorLocationRequest } from '@venta/proto/location-services/geolocation';
import { validateCoordinates, validateSchema } from '@venta/utils';
import { grpcGeospatialQuerySchema } from '../schemas/location.schemas';
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
	static validateIncoming(grpc: EventDataMap['location.vendor.location_update_requested']): void {
		validateSchema(locationEventSchemas['location.vendor.location_update_requested'], grpc);
		validateCoordinates(grpc.location);
	}

	static toDomain(grpc: EventDataMap['location.vendor.location_update_requested']): LocationUpdate {
		this.validateIncoming(grpc);

		return {
			entityId: grpc.vendorId,
			coordinates: {
				lat: grpc.location.lat,
				lng: grpc.location.lng,
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

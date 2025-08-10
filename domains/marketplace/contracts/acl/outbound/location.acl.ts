import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
// Domain types (what we're transforming from)
import type { VendorLocationChange } from '../../types/domain';

// gRPC types (what we're transforming to) - import from proto when available
// TODO: Replace with actual proto imports when location service proto is available

// ============================================================================
// OUTBOUND LOCATION ACL PIPES - Transform domain types to location service gRPC
// ============================================================================

/**
 * Vendor Location Update to Location Service ACL Pipe
 * Transforms marketplace VendorLocationChange to location service format
 */
@Injectable()
export class VendorLocationUpdateLocationACLPipe
	implements PipeTransform<VendorLocationChange, LocationVendorUpdateRequest>
{
	transform(value: VendorLocationChange, _metadata: ArgumentMetadata): LocationVendorUpdateRequest {
		if (!value.location) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				vendorId: value.vendorId,
				message: 'Location data is required',
			});
		}

		return {
			vendorId: value.vendorId,
			lat: value.location.lat,
			lng: value.location.lng,
			timestamp: value.timestamp || new Date().toISOString(),
			metadata: {
				source: 'marketplace',
				accuracy: value.location.accuracy,
			},
		};
	}
}

/**
 * User Location Update to Location Service ACL Pipe
 * Transforms marketplace user location to location service format
 */
@Injectable()
export class UserLocationUpdateLocationACLPipe
	implements PipeTransform<UserLocationUpdateData, LocationUserUpdateRequest>
{
	transform(value: UserLocationUpdateData, _metadata: ArgumentMetadata): LocationUserUpdateRequest {
		if (!value.location) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				userId: value.userId,
				message: 'Location data is required',
			});
		}

		return {
			userId: value.userId,
			lat: value.location.lat,
			lng: value.location.lng,
			timestamp: value.timestamp || new Date().toISOString(),
			metadata: {
				source: 'marketplace',
				accuracy: value.location.accuracy,
			},
		};
	}
}

/**
 * Geospatial Bounds Query to Location Service ACL Pipe
 * Transforms marketplace geospatial query to location service format
 */
@Injectable()
export class GeospatialBoundsLocationACLPipe implements PipeTransform<GeospatialBoundsQuery, LocationBoundsRequest> {
	transform(value: GeospatialBoundsQuery, _metadata: ArgumentMetadata): LocationBoundsRequest {
		if (!value.bounds) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				message: 'Geospatial bounds are required',
			});
		}

		return {
			bounds: {
				ne: {
					lat: value.bounds.ne.lat,
					lng: value.bounds.ne.lng,
				},
				sw: {
					lat: value.bounds.sw.lat,
					lng: value.bounds.sw.lng,
				},
			},
			includeInactive: value.includeInactive || false,
		};
	}
}

// ============================================================================
// Types (temporary until proto imports and domain types are available)
// ============================================================================

interface UserLocationUpdateData {
	userId: string;
	location: {
		lat: number;
		lng: number;
		accuracy?: number;
	};
	timestamp?: string;
}

interface GeospatialBoundsQuery {
	bounds: {
		ne: { lat: number; lng: number };
		sw: { lat: number; lng: number };
	};
	includeInactive?: boolean;
}

interface LocationVendorUpdateRequest {
	vendorId: string;
	lat: number;
	lng: number;
	timestamp: string;
	metadata?: {
		source: string;
		accuracy?: number;
	};
}

interface LocationUserUpdateRequest {
	userId: string;
	lat: number;
	lng: number;
	timestamp: string;
	metadata?: {
		source: string;
		accuracy?: number;
	};
}

interface LocationBoundsRequest {
	bounds: {
		ne: { lat: number; lng: number };
		sw: { lat: number; lng: number };
	};
	includeInactive: boolean;
}

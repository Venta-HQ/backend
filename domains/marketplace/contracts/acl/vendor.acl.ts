import { AppError, ErrorCodes } from '@venta/nest/errors';
// gRPC types (wire format) - directly from proto
import type {
	VendorCreateData,
	VendorIdentityData,
	VendorLocationRequest,
	VendorLocationUpdate,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';
// Domain types (what gRPC maps to)
import type {
	VendorCreate,
	VendorLocationChange,
	VendorLocationQuery,
	VendorLookup,
	VendorUpdate,
} from '../types/domain';

// ============================================================================
// VENDOR ACL - Bidirectional gRPC ↔ Domain transformation
// ============================================================================

/**
 * Vendor Lookup ACL
 * Bidirectional validation and transformation for vendor lookup operations
 */
export class VendorLookupACL {
	// gRPC → Domain (inbound)
	static validate(grpc: { id: string }): void {
		if (!grpc.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'Vendor ID is required',
			});
		}
	}

	static toDomain(grpc: { id: string }): VendorLookup {
		this.validate(grpc);

		return {
			vendorId: grpc.id,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorLookup): void {
		if (!domain.vendorId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'Vendor ID is required',
			});
		}
	}

	static toGrpc(domain: VendorLookup): VendorIdentityData {
		this.validateDomain(domain);

		return {
			id: domain.vendorId,
		};
	}
}

/**
 * Vendor Create ACL
 * Bidirectional validation and transformation for vendor creation operations
 */
export class VendorCreateACL {
	// gRPC → Domain (inbound)
	static validate(grpc: VendorCreateData): void {
		if (!grpc.name?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'name',
				message: 'Vendor name is required',
			});
		}
		if (!grpc.email?.includes('@')) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'email',
				message: 'Valid email address is required',
			});
		}
		if (!grpc.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}
	}

	static toDomain(grpc: VendorCreateData): VendorCreate {
		this.validate(grpc);

		return {
			name: grpc.name,
			description: grpc.description,
			email: grpc.email,
			phone: grpc.phone,
			website: grpc.website,
			imageUrl: grpc.profileImage,
			userId: grpc.userId,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorCreate): void {
		if (!domain.name?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'name',
				message: 'Vendor name is required',
			});
		}
		if (!domain.email?.includes('@')) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'email',
				message: 'Valid email address is required',
			});
		}
		if (!domain.userId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'userId',
				message: 'User ID is required',
			});
		}
	}

	static toGrpc(domain: VendorCreate): VendorCreateData {
		this.validateDomain(domain);

		return {
			name: domain.name,
			description: domain.description,
			email: domain.email,
			phone: domain.phone,
			website: domain.website,
			imageUrl: domain.imageUrl,
			userId: domain.userId,
		};
	}
}

/**
 * Vendor Update ACL
 * Bidirectional validation and transformation for vendor update operations
 */
export class VendorUpdateACL {
	// gRPC → Domain (inbound)
	static validate(grpc: VendorUpdateData): void {
		if (!grpc.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'Vendor ID is required',
			});
		}
		if (!grpc.name?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'name',
				message: 'Vendor name is required',
			});
		}
		if (grpc.email && !grpc.email.includes('@')) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'email',
				message: 'Valid email address is required',
			});
		}
	}

	static toDomain(grpc: VendorUpdateData): VendorUpdate {
		this.validate(grpc);

		return {
			id: grpc.id,
			name: grpc.name,
			description: grpc.description,
			email: grpc.email,
			phone: grpc.phone,
			website: grpc.website,
			imageUrl: grpc.imageUrl,
			userId: grpc.userId,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorUpdate): void {
		if (!domain.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'Vendor ID is required',
			});
		}
		if (!domain.name?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'name',
				message: 'Vendor name is required',
			});
		}
		if (domain.email && !domain.email.includes('@')) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'email',
				message: 'Valid email address is required',
			});
		}
	}

	static toGrpc(domain: VendorUpdate): VendorUpdateData {
		this.validateDomain(domain);

		return {
			id: domain.id,
			name: domain.name,
			description: domain.description,
			email: domain.email,
			phone: domain.phone,
			website: domain.website,
			imageUrl: domain.imageUrl,
			userId: domain.userId,
		};
	}
}

/**
 * Vendor Location Update ACL
 * Bidirectional validation and transformation for vendor location operations
 */
export class VendorLocationUpdateACL {
	// gRPC → Domain (inbound)
	static validate(grpc: VendorLocationUpdate): void {
		if (!grpc.vendorId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'vendorId',
				message: 'Vendor ID is required',
			});
		}
		if (!grpc.coordinates?.lat || !grpc.coordinates?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'coordinates',
				message: 'Valid coordinates (lat, long) are required',
			});
		}
	}

	static toDomain(grpc: VendorLocationUpdate): VendorLocationUpdate {
		this.validate(grpc);

		return grpc; // Return validated gRPC type directly
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorLocationChange): void {
		if (!domain.vendorId?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'vendorId',
				message: 'Vendor ID is required',
			});
		}
		if (!domain.coordinates?.lat || !domain.coordinates?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'coordinates',
				message: 'Valid coordinates (lat, lng) are required',
			});
		}
	}

	static toGrpc(domain: VendorLocationChange): VendorLocationUpdate {
		this.validateDomain(domain);

		return {
			vendorId: domain.vendorId,
			coordinates: {
				lat: domain.coordinates.lat,
				lng: domain.coordinates.lng, // Convert 'lng' back to 'long'
			},
		};
	}
}

/**
 * Vendor Geospatial Bounds ACL
 * Bidirectional validation and transformation for vendor location queries
 */
export class VendorGeospatialBoundsACL {
	// gRPC → Domain (inbound)
	static validate(grpc: VendorLocationRequest): void {
		if (!grpc.ne?.lat || !grpc.ne?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'ne',
				message: 'Northeast coordinates (lat, long) are required',
			});
		}
		if (!grpc.sw?.lat || !grpc.sw?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'sw',
				message: 'Southwest coordinates (lat, long) are required',
			});
		}
	}

	static toDomain(grpc: VendorLocationRequest): VendorLocationRequest {
		this.validate(grpc);

		return grpc; // Return validated gRPC type directly
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorLocationQuery): void {
		if (!domain.ne?.lat || !domain.ne?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'ne',
				message: 'Northeast coordinates (lat, lng) are required',
			});
		}
		if (!domain.sw?.lat || !domain.sw?.lng) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'sw',
				message: 'Southwest coordinates (lat, lng) are required',
			});
		}
	}

	static toGrpc(domain: VendorLocationQuery): VendorLocationRequest {
		this.validateDomain(domain);

		return {
			ne: {
				lat: domain.ne.lat,
				lng: domain.ne.lng, // Convert 'lng' back to 'long'
			},
			sw: {
				lat: domain.sw.lat,
				lng: domain.sw.lng, // Convert 'lng' back to 'long'
			},
		};
	}
}

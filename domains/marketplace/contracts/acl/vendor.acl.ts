// gRPC types (wire format) - directly from proto
import type {
	VendorCreateData,
	VendorIdentityData,
	VendorLocationRequest,
	VendorLocationUpdate,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';
// Validation utilities
import {
	validateCoordinates,
	validateEmail,
	validateOptionalEmail,
	validateRequiredString,
} from '../schemas/validation.utils';
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
		validateRequiredString(grpc.id, 'id');
	}

	static toDomain(grpc: { id: string }): VendorLookup {
		this.validate(grpc);

		return {
			vendorId: grpc.id,
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorLookup): void {
		validateRequiredString(domain.vendorId, 'vendorId');
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
		validateRequiredString(grpc.name, 'name');
		validateEmail(grpc.email, 'email');
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
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorCreate): void {
		validateRequiredString(domain.name, 'name');
		validateEmail(domain.email, 'email');
	}

	static toGrpc(domain: VendorCreate): VendorCreateData {
		this.validateDomain(domain);

		return {
			name: domain.name,
			description: domain.description,
			email: domain.email,
			phone: domain.phone,
			website: domain.website,
			profileImage: domain.imageUrl,
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
		validateRequiredString(grpc.id, 'id');
		validateRequiredString(grpc.name, 'name');
		validateOptionalEmail(grpc.email, 'email');
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
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorUpdate): void {
		validateRequiredString(domain.id, 'id');
		validateRequiredString(domain.name, 'name');
		validateOptionalEmail(domain.email, 'email');
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
		validateRequiredString(grpc.vendorId, 'vendorId');
		validateCoordinates(grpc.coordinates, 'coordinates');
	}

	static toDomain(grpc: VendorLocationUpdate): VendorLocationUpdate {
		this.validate(grpc);

		return {
			vendorId: grpc.vendorId,
			coordinates: validateCoordinates(grpc.coordinates, 'coordinates'),
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorLocationChange): void {
		validateRequiredString(domain.vendorId, 'vendorId');
		validateCoordinates(domain.coordinates, 'coordinates');
	}

	static toGrpc(domain: VendorLocationChange): VendorLocationUpdate {
		this.validateDomain(domain);

		return {
			vendorId: domain.vendorId,
			coordinates: {
				lat: domain.coordinates.lat,
				lng: domain.coordinates.lng,
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
		validateCoordinates(grpc.ne, 'ne');
		validateCoordinates(grpc.sw, 'sw');
	}

	static toDomain(grpc: VendorLocationRequest): VendorLocationRequest {
		this.validate(grpc);

		return {
			ne: validateCoordinates(grpc.ne, 'ne'),
			sw: validateCoordinates(grpc.sw, 'sw'),
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: VendorLocationQuery): void {
		validateCoordinates(domain.ne, 'ne');
		validateCoordinates(domain.sw, 'sw');
	}

	static toGrpc(domain: VendorLocationQuery): VendorLocationRequest {
		this.validateDomain(domain);

		return {
			ne: {
				lat: domain.ne.lat,
				lng: domain.ne.lng,
			},
			sw: {
				lat: domain.sw.lat,
				lng: domain.sw.lng,
			},
		};
	}
}

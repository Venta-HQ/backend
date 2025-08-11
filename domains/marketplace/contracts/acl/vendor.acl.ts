// gRPC types (wire format) - directly from proto
import type {
	VendorCreateData,
	VendorIdentityData,
	VendorLocationRequest,
	VendorLocationUpdate,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';
import { validateSchema } from '@venta/utils';
// Validation utilities
import {
	grpcVendorCreateSchema,
	grpcVendorLocationRequestSchema,
	grpcVendorLocationUpdateSchema,
	grpcVendorLookupSchema,
	grpcVendorUpdateSchema,
} from '../schemas/vendor.schemas';
// Domain types (what gRPC maps to)
import type { VendorCreate, VendorLookup, VendorUpdate } from '../types/domain';

// ============================================================================
// VENDOR ACL - Bidirectional gRPC ↔ Domain transformation
// ============================================================================

/**
 * Vendor Lookup ACL
 * Bidirectional validation and transformation for vendor lookup operations
 */
export class VendorLookupACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: VendorIdentityData): void {
		validateSchema(grpcVendorLookupSchema, grpc);
	}

	static toDomain(grpc: VendorIdentityData): VendorLookup {
		this.validateIncoming(grpc);

		return {
			vendorId: grpc.id,
		};
	}
}

/**
 * Vendor Create ACL
 * Bidirectional validation and transformation for vendor creation operations
 */
export class VendorCreateACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: VendorCreateData): void {
		validateSchema(grpcVendorCreateSchema, grpc);
	}

	static toDomain(grpc: VendorCreateData): VendorCreate {
		this.validateIncoming(grpc);

		return {
			name: grpc.name,
			description: grpc.description,
			email: grpc.email,
			phone: grpc.phone,
			website: grpc.website,
			imageUrl: grpc.profileImage,
		};
	}
}

/**
 * Vendor Update ACL
 * Bidirectional validation and transformation for vendor update operations
 */
export class VendorUpdateACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: VendorUpdateData): void {
		validateSchema(grpcVendorUpdateSchema, grpc);
	}

	static toDomain(grpc: VendorUpdateData): VendorUpdate {
		this.validateIncoming(grpc);

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
}

/**
 * Vendor Location Update ACL
 * Bidirectional validation and transformation for vendor location operations
 */
export class VendorLocationUpdateACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: VendorLocationUpdate): void {
		validateSchema(grpcVendorLocationUpdateSchema, grpc);
	}

	static toDomain(grpc: VendorLocationUpdate): VendorLocationUpdate {
		this.validateIncoming(grpc);

		return {
			vendorId: grpc.vendorId,
			coordinates: grpc.coordinates,
		};
	}
}

/**
 * Vendor Geospatial Bounds ACL
 * Bidirectional validation and transformation for vendor location queries
 */
export class VendorGeospatialBoundsACL {
	// gRPC → Domain (inbound)
	static validateIncoming(grpc: VendorLocationRequest): void {
		validateSchema(grpcVendorLocationRequestSchema, grpc);
	}

	static toDomain(grpc: VendorLocationRequest): VendorLocationRequest {
		this.validateIncoming(grpc);

		return {
			ne: grpc.ne,
			sw: grpc.sw,
		};
	}
}

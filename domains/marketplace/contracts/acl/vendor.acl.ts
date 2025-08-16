// gRPC types (wire format) - directly from proto
import type {
	VendorCreateData,
	VendorIdentityData,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';
import { validateSchema } from '@venta/utils';
// Validation utilities
import { grpcVendorCreateSchema, grpcVendorLookupSchema, grpcVendorUpdateSchema } from '../schemas/vendor.schemas';
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
			profileImage: grpc.profileImage,
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
			profileImage: grpc.profileImage,
		};
	}
}

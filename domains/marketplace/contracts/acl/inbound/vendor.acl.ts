import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
// gRPC types (wire format) - directly from proto
import type {
	VendorCreateData,
	VendorLocationRequest,
	VendorLocationUpdate,
	VendorLookupByIdData,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';
import {
	GrpcGeospatialBoundsSchema,
	GrpcVendorCreateDataSchema,
	GrpcVendorLocationDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
} from '../../schemas/vendor/vendor.schemas';
// Domain types (what gRPC maps to)
import type {
	VendorCreate,
	VendorLocationChange,
	VendorLocationQuery,
	VendorLookup,
	VendorUpdate,
} from '../../types/domain';

// ============================================================================
// INBOUND VENDOR ACL PIPES - Transform gRPC types to domain types
// ============================================================================

/**
 * Vendor Create ACL Pipe
 * Transforms gRPC VendorCreateData to domain VendorCreate
 */
@Injectable()
export class VendorCreateACLPipe implements PipeTransform<VendorCreateData, VendorCreate> {
	private validator = new SchemaValidatorPipe(GrpcVendorCreateDataSchema);

	transform(value: VendorCreateData, metadata: ArgumentMetadata): VendorCreate {
		const validated = this.validator.transform(value, metadata);

		// Transform to internal domain shape
		return {
			name: validated.name,
			description: validated.description,
			email: validated.email,
			phone: validated.phone,
			website: validated.website,
			imageUrl: validated.imageUrl,
			userId: validated.userId,
		};
	}
}

/**
 * Vendor Update ACL Pipe
 * Transforms gRPC VendorUpdateData to domain VendorUpdate
 */
@Injectable()
export class VendorUpdateACLPipe implements PipeTransform<VendorUpdateData, VendorUpdate> {
	private validator = new SchemaValidatorPipe(GrpcVendorUpdateDataSchema);

	transform(value: VendorUpdateData, metadata: ArgumentMetadata): VendorUpdate {
		const validated = this.validator.transform(value, metadata);

		return {
			id: validated.id,
			name: validated.name,
			description: validated.description,
			email: validated.email,
			phone: validated.phone,
			website: validated.website,
			imageUrl: validated.imageUrl,
		};
	}
}

/**
 * Vendor Lookup ACL Pipe
 * Transforms gRPC VendorLookupByIdData to domain VendorLookup
 */
@Injectable()
export class VendorLookupACLPipe implements PipeTransform<VendorLookupByIdData, VendorLookup> {
	private validator = new SchemaValidatorPipe(GrpcVendorLookupDataSchema);

	transform(value: VendorLookupByIdData, metadata: ArgumentMetadata): VendorLookup {
		const validated = this.validator.transform(value, metadata);

		return {
			id: validated.id,
		};
	}
}

/**
 * Vendor Location Update ACL Pipe
 * Transforms gRPC VendorLocationUpdate to domain VendorLocationChange
 */
@Injectable()
export class VendorLocationUpdateACLPipe implements PipeTransform<VendorLocationUpdate, VendorLocationChange> {
	private validator = new SchemaValidatorPipe(GrpcVendorLocationDataSchema);

	transform(value: VendorLocationUpdate, metadata: ArgumentMetadata): VendorLocationChange {
		const validated = this.validator.transform(value, metadata);

		return {
			vendorId: validated.vendorId,
			location: validated.location,
			timestamp: validated.timestamp || new Date().toISOString(),
		};
	}
}

/**
 * Vendor Geospatial Bounds ACL Pipe
 * Transforms gRPC VendorLocationRequest to domain VendorLocationQuery
 */
@Injectable()
export class VendorGeospatialBoundsACLPipe implements PipeTransform<VendorLocationRequest, VendorLocationQuery> {
	private validator = new SchemaValidatorPipe(GrpcGeospatialBoundsSchema);

	transform(value: VendorLocationRequest, metadata: ArgumentMetadata): VendorLocationQuery {
		const validated = this.validator.transform(value, metadata);

		return {
			bounds: validated.bounds,
			includeInactive: validated.includeInactive,
		};
	}
}

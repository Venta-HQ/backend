import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import {
	VendorCreateData,
	VendorLocationUpdate,
	VendorLookupByIdData,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';
import {
	GrpcVendorCreateDataSchema,
	GrpcVendorLocationDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
} from '../schemas/vendor/vendor.schemas';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for vendor data validation and transformation
 *
 * Follows the standard ACL pattern:
 * 1. Validation methods use type predicates with safeParse
 * 2. Transformation methods are separate from validation
 * 3. Each external type has its own validation schema
 * 4. Each transformation has clear input/output types
 */
@Injectable()
export class VendorACL {
	private readonly logger = new Logger(VendorACL.name);

	// ============================================================================
	// Validation Methods
	// Each method validates a specific external data type using a Zod schema
	// Returns a type predicate for TypeScript type narrowing
	// ============================================================================

	/**
	 * Validate vendor lookup data
	 * @returns Type predicate for TypeScript type narrowing
	 */
	validateVendorLookupById(data: unknown): data is VendorLookupByIdData {
		const result = GrpcVendorLookupDataSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_UUID, {
				uuid: (data as any)?.id || 'undefined',
				errors: result.error.errors,
			});
		}
		return true;
	}

	/**
	 * Validate vendor creation data
	 * @returns Type predicate for TypeScript type narrowing
	 */
	validateVendorCreateData(data: unknown): data is VendorCreateData {
		const result = GrpcVendorCreateDataSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				message: 'Invalid vendor data',
				errors: result.error.errors,
				userId: (data as any)?.userId || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Validate vendor update data
	 * @returns Type predicate for TypeScript type narrowing
	 */
	validateVendorUpdateData(data: unknown): data is VendorUpdateData {
		const result = GrpcVendorUpdateDataSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				message: 'Invalid vendor update data',
				errors: result.error.errors,
				vendorId: (data as any)?.id || 'undefined',
				userId: (data as any)?.userId || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Validate vendor location update data
	 * @returns Type predicate for TypeScript type narrowing
	 */
	validateVendorLocationUpdate(data: unknown): data is VendorLocationUpdate {
		const result = GrpcVendorLocationDataSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				lat: (data as any)?.location?.lat || 'undefined',
				long: (data as any)?.location?.long || 'undefined',
				vendorId: (data as any)?.vendorId || 'undefined',
			});
		}
		return true;
	}

	// ============================================================================
	// Transformation Methods
	// Each method transforms data between external and domain formats
	// Input/output types are explicitly defined
	// No validation here - validation should be done before transformation
	// ============================================================================

	/**
	 * Transform vendor creation data to domain format
	 */
	toDomainVendorCreateData(data: Marketplace.Core.VendorCreateData): Marketplace.Core.VendorCreateData {
		if (!data?.userId || !data?.name) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !data?.userId ? 'userId' : 'name',
				userId: data?.userId || 'undefined',
			});
		}

		return {
			userId: data.userId,
			name: data.name,
			description: data.description,
			email: data.email,
			phone: data.phone,
			website: data.website,
			imageUrl: data.imageUrl,
		};
	}

	/**
	 * Transform vendor update data to domain format
	 */
	toDomainVendorUpdateData(data: Marketplace.Core.VendorUpdateData): Marketplace.Core.VendorUpdateData {
		if (!data?.id || !data?.userId) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !data?.id ? 'id' : 'userId',
				vendorId: data?.id || 'undefined',
				userId: data?.userId || 'undefined',
			});
		}

		return {
			id: data.id,
			userId: data.userId,
			name: data.name,
			description: data.description,
			email: data.email,
			phone: data.phone,
			website: data.website,
			imageUrl: data.imageUrl,
		};
	}

	/**
	 * Transform vendor location update to domain format
	 */
	toDomainVendorLocationUpdate(data: {
		vendorId: string;
		location?: { lat: number; long: number };
	}): Marketplace.Core.VendorLocationUpdate {
		if (!data?.vendorId || !data?.location?.lat || !data?.location?.long) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				lat: data?.location?.lat || 'undefined',
				long: data?.location?.long || 'undefined',
				vendorId: data?.vendorId || 'undefined',
			});
		}

		return {
			vendorId: data.vendorId,
			location: {
				lat: data.location.lat,
				long: data.location.long,
			},
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Transform geospatial bounds to domain format
	 */
	toDomainGeospatialBounds(data: {
		neLocation?: { lat: number; long: number };
		swLocation?: { lat: number; long: number };
	}): Marketplace.Core.GeospatialBounds {
		if (!data?.neLocation?.lat || !data?.neLocation?.long || !data?.swLocation?.lat || !data?.swLocation?.long) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				neLat: data?.neLocation?.lat || 'undefined',
				neLong: data?.neLocation?.long || 'undefined',
				swLat: data?.swLocation?.lat || 'undefined',
				swLong: data?.swLocation?.long || 'undefined',
			});
		}

		return {
			ne: {
				lat: data.neLocation.lat,
				long: data.neLocation.long,
			},
			sw: {
				lat: data.swLocation.lat,
				long: data.swLocation.long,
			},
		};
	}
}

import { AppError, ErrorCodes } from '@app/nest/errors';
import {
	VendorCreateData,
	VendorLocationUpdate,
	VendorLookupByIdData,
	VendorUpdateData,
} from '@app/proto/marketplace/vendor-management';
import { Injectable, Logger } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';
import {
	GrpcVendorCreateDataSchema,
	GrpcVendorLocationDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
} from '../types/vendor/vendor.schemas';

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
			throw AppError.validation(ErrorCodes.INVALID_VENDOR_ID, ErrorCodes.INVALID_VENDOR_ID, {
				operation: 'validate_vendor_lookup',
				errors: result.error.errors,
				vendorId: (data as any)?.id || 'undefined',
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
			throw AppError.validation(ErrorCodes.INVALID_VENDOR_DATA, ErrorCodes.INVALID_VENDOR_DATA, {
				operation: 'validate_vendor_create',
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
			throw AppError.validation(ErrorCodes.INVALID_VENDOR_DATA, ErrorCodes.INVALID_VENDOR_DATA, {
				operation: 'validate_vendor_update',
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
			throw AppError.validation(ErrorCodes.VENDOR_INVALID_LOCATION, ErrorCodes.VENDOR_INVALID_LOCATION, {
				operation: 'validate_vendor_location',
				errors: result.error.errors,
				vendorId: (data as any)?.vendorId || 'undefined',
				location: (data as any)?.location || 'undefined',
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
			throw AppError.validation(ErrorCodes.MISSING_REQUIRED_FIELD, ErrorCodes.MISSING_REQUIRED_FIELD, {
				operation: 'to_domain_vendor_create',
				userId: data?.userId || 'undefined',
				field: !data?.userId ? 'userId' : 'name',
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
			throw AppError.validation(ErrorCodes.MISSING_REQUIRED_FIELD, ErrorCodes.MISSING_REQUIRED_FIELD, {
				operation: 'to_domain_vendor_update',
				vendorId: data?.id || 'undefined',
				userId: data?.userId || 'undefined',
				field: !data?.id ? 'id' : 'userId',
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
			throw AppError.validation(ErrorCodes.VENDOR_INVALID_LOCATION, ErrorCodes.VENDOR_INVALID_LOCATION, {
				operation: 'to_domain_vendor_location',
				vendorId: data?.vendorId || 'undefined',
				location: data?.location || 'undefined',
				field: !data?.vendorId ? 'vendorId' : !data?.location?.lat ? 'location.lat' : 'location.long',
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
			throw AppError.validation(ErrorCodes.LOCATION_INVALID_COORDINATES, ErrorCodes.LOCATION_INVALID_COORDINATES, {
				operation: 'to_domain_geospatial_bounds',
				neLocation: data?.neLocation || 'undefined',
				swLocation: data?.swLocation || 'undefined',
				field: !data?.neLocation?.lat
					? 'neLocation.lat'
					: !data?.neLocation?.long
						? 'neLocation.long'
						: !data?.swLocation?.lat
							? 'swLocation.lat'
							: 'swLocation.long',
			});
		}

		return {
			neBounds: {
				lat: data.neLocation.lat,
				long: data.neLocation.long,
			},
			swBounds: {
				lat: data.swLocation.lat,
				long: data.swLocation.long,
			},
		};
	}
	d;
}

import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
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
	validateVendorLookupById(data: unknown): data is { id: string } {
		const result = GrpcVendorLookupDataSchema.safeParse(data);
		if (!result.success) {
			this.logger.error('Invalid vendor lookup data', {
				errors: result.error.errors,
			});
			throw AppError.validation('VENDOR_NOT_FOUND', ErrorCodes.VENDOR_NOT_FOUND, {
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
	validateVendorCreateData(data: unknown): data is Marketplace.Core.VendorCreateData {
		const result = GrpcVendorCreateDataSchema.safeParse(data);
		if (!result.success) {
			this.logger.error('Invalid vendor create data', {
				errors: result.error.errors,
			});
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				errors: result.error.errors,
				message: 'Invalid vendor create data',
			});
		}
		return true;
	}

	/**
	 * Validate vendor update data
	 * @returns Type predicate for TypeScript type narrowing
	 */
	validateVendorUpdateData(data: unknown): data is Marketplace.Core.VendorUpdateData {
		const result = GrpcVendorUpdateDataSchema.safeParse(data);
		if (!result.success) {
			this.logger.error('Invalid vendor update data', {
				errors: result.error.errors,
			});
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				errors: result.error.errors,
				message: 'Invalid vendor update data',
			});
		}
		return true;
	}

	/**
	 * Validate vendor location update data
	 * @returns Type predicate for TypeScript type narrowing
	 */
	validateVendorLocationUpdate(data: unknown): data is Marketplace.Core.VendorLocationUpdate {
		const result = GrpcVendorLocationDataSchema.safeParse(data);
		if (!result.success) {
			this.logger.error('Invalid vendor location data', {
				errors: result.error.errors,
			});
			throw AppError.validation('LOCATION_INVALID_COORDINATES', ErrorCodes.LOCATION_INVALID_COORDINATES, {
				errors: result.error.errors,
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
	toDomainVendorLocationUpdate(data: Marketplace.Core.VendorLocationUpdate): Marketplace.Core.VendorLocationUpdate {
		return {
			vendorId: data.vendorId,
			location: {
				lat: data.location.lat,
				lng: data.location.lng,
			},
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Transform geospatial bounds to domain format
	 */
	toDomainGeospatialBounds(data: {
		neLocation: { lat: number; long: number };
		swLocation: { lat: number; long: number };
	}): Marketplace.Core.GeospatialBounds {
		return {
			neBounds: {
				lat: data.neLocation.lat,
				lng: data.neLocation.long,
			},
			swBounds: {
				lat: data.swLocation.lat,
				lng: data.swLocation.long,
			},
		};
	}
}

import { AppError } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';
import {
	GrpcVendorCreateDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
} from '../types/vendor/vendor.schemas';

/**
 * Anti-Corruption Layer for vendor data validation
 */
@Injectable()
export class VendorACL {
	private readonly logger = new Logger(VendorACL.name);

	/**
	 * Validate vendor creation data
	 */
	validateVendorCreateData(data: unknown): data is Marketplace.Core.VendorCreateData {
		try {
			const result = GrpcVendorCreateDataSchema.safeParse(data);
			if (!result.success) {
				this.logger.error('Invalid vendor create data', {
					errors: result.error.errors,
				});
				return false;
			}
			return true;
		} catch (error) {
			this.logger.error('Failed to validate vendor create data', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Validate vendor update data
	 */
	validateVendorUpdateData(data: unknown): data is Marketplace.Core.VendorUpdateData {
		try {
			const result = GrpcVendorUpdateDataSchema.safeParse(data);
			if (!result.success) {
				this.logger.error('Invalid vendor update data', {
					errors: result.error.errors,
				});
				return false;
			}
			return true;
		} catch (error) {
			this.logger.error('Failed to validate vendor update data', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Validate vendor lookup data
	 */
	validateVendorLookupData(data: unknown): data is { id: string } {
		try {
			const result = GrpcVendorLookupDataSchema.safeParse(data);
			if (!result.success) {
				this.logger.error('Invalid vendor lookup data', {
					errors: result.error.errors,
				});
				return false;
			}
			return true;
		} catch (error) {
			this.logger.error('Failed to validate vendor lookup data', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Validate vendor location data
	 */
	validateVendorLocationData(data: unknown): data is Marketplace.Core.VendorLocation {
		try {
			if (!data || typeof data !== 'object') return false;
			const location = data as Marketplace.Core.VendorLocation;

			return (
				typeof location.lat === 'number' &&
				typeof location.lng === 'number' &&
				typeof location.vendorId === 'string' &&
				typeof location.updatedAt === 'string'
			);
		} catch (error) {
			this.logger.error('Failed to validate vendor location data', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Handle vendor error
	 */
	handleVendorError(error: unknown, context: { operation: string; vendorId?: string }): never {
		this.logger.error('Vendor operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			vendorId: context.vendorId,
		});

		throw AppError.internal('VENDOR_OPERATION_FAILED', 'Vendor operation failed', context);
	}
}

import {
	CreateVendorSchema,
	UpdateVendorSchema,
} from '@domains/infrastructure/contracts/schemas/vendor/vendor.schemas';
import { CreateVendorData, UpdateVendorData } from '@domains/infrastructure/contracts/types/vendor/vendor.types';
import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * Anti-Corruption Layer for vendor HTTP data validation
 */
@Injectable()
export class VendorHttpACL {
	private readonly logger = new Logger(VendorHttpACL.name);

	/**
	 * Validate vendor creation data
	 */
	validateVendorCreateData(data: unknown): data is CreateVendorData {
		try {
			const result = CreateVendorSchema.safeParse(data);
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
	validateVendorUpdateData(data: unknown): data is UpdateVendorData {
		try {
			const result = UpdateVendorSchema.safeParse(data);
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
	 * Handle vendor error
	 */
	handleVendorError(error: unknown, context: { operation: string; vendorId?: string }): never {
		// If it's already an AppError, rethrow it
		if (error instanceof AppError) {
			throw error;
		}

		// Log the error with context
		this.logger.error('Vendor operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			vendorId: context.vendorId,
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Throw standardized error
		throw AppError.internal(ErrorCodes.ERR_INFRA_GATEWAY_ERROR, {
			message: 'Vendor operation failed',
			operation: context.operation,
			vendorId: context.vendorId,
		});
	}
}

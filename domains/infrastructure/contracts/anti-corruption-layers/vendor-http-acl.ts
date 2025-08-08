import { AppError } from '@app/nest/errors';
import { CreateVendorSchema, UpdateVendorSchema } from '@domains/infrastructure/contracts/types/vendor/vendor.schemas';
import { Injectable, Logger } from '@nestjs/common';
import { Infrastructure } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for vendor HTTP data validation
 */
@Injectable()
export class VendorHttpACL {
	private readonly logger = new Logger(VendorHttpACL.name);

	/**
	 * Validate vendor creation data
	 */
	validateVendorCreateData(data: unknown): data is Infrastructure.Core.VendorCreateData {
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
	validateVendorUpdateData(data: unknown): data is Infrastructure.Core.VendorUpdateData {
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
		this.logger.error('Vendor operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			vendorId: context.vendorId,
		});

		throw AppError.internal('VENDOR_OPERATION_FAILED', 'Vendor operation failed', context);
	}
}

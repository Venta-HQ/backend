import { Injectable, Logger } from '@nestjs/common';
import { UserVendorRequestSchema } from '@venta/domains/infrastructure/contracts/schemas/user/user.schemas';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Infrastructure } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for user HTTP data validation
 */
@Injectable()
export class UserHttpACL {
	private readonly logger = new Logger(UserHttpACL.name);

	/**
	 * Validate user vendor request data
	 */
	validateUserVendorRequest(data: unknown): data is Infrastructure.Contracts.UserVendorRequest {
		try {
			const result = UserVendorRequestSchema.safeParse(data);
			if (!result.success) {
				this.logger.error('Invalid user vendor request data', {
					errors: result.error.errors,
				});
				return false;
			}
			return true;
		} catch (error) {
			this.logger.error('Failed to validate user vendor request data', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Handle user error
	 */
	handleUserError(error: unknown, context: { operation: string; userId?: string }): never {
		// If it's already an AppError, rethrow it
		if (error instanceof AppError) {
			throw error;
		}

		// Log the error with context
		this.logger.error('User operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			userId: context.userId,
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Throw standardized error
		throw AppError.internal(ErrorCodes.ERR_INFRA_GATEWAY_ERROR, {
			message: 'User operation failed',
			operation: context.operation,
			userId: context.userId,
		});
	}
}

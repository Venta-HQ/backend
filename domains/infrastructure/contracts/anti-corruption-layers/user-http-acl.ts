import { AppError } from '@app/nest/errors';
import { UserVendorRequestSchema } from '@domains/infrastructure/contracts/types/user/user.schemas';
import { Injectable, Logger } from '@nestjs/common';
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
	validateUserVendorRequest(data: unknown): data is Infrastructure.Core.UserVendorRequest {
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
		this.logger.error('User operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			userId: context.userId,
		});

		throw AppError.internal('USER_OPERATION_FAILED', 'User operation failed', context);
	}
}

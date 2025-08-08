import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';
import { ClerkUserSchema, GrpcUserIdentitySchema } from '../types/user/user.schemas';

/**
 * Anti-Corruption Layer for Clerk integration
 */
@Injectable()
export class ClerkAntiCorruptionLayer {
	private readonly logger = new Logger(ClerkAntiCorruptionLayer.name);

	/**
	 * Validate user identity data
	 */
	validateUserIdentity(data: unknown): data is { id: string } {
		const result = GrpcUserIdentitySchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation('USER_INVALID_CREDENTIALS', ErrorCodes.USER_INVALID_CREDENTIALS, {
				operation: 'validate_user_identity',
				errors: result.error.errors,
				userId: (data as any)?.id || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Validate Clerk user data
	 */
	validateClerkUser(data: unknown): data is Marketplace.External.ClerkUser {
		const result = ClerkUserSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation('USER_INVALID_DATA', ErrorCodes.USER_INVALID_DATA, {
				operation: 'validate_clerk_user',
				errors: result.error.errors,
				userId: (data as any)?.id || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Convert Clerk user to domain user
	 */
	toDomainUser(user: Marketplace.External.ClerkUser): Marketplace.Core.User {
		if (!user?.id || !user?.email_addresses?.[0]?.email_address) {
			throw AppError.validation('MISSING_REQUIRED_FIELD', ErrorCodes.MISSING_REQUIRED_FIELD, {
				operation: 'to_domain_user',
				userId: user?.id || 'undefined',
				field: !user?.id ? 'id' : 'email_address',
			});
		}

		return {
			id: user.id,
			email: user.email_addresses[0].email_address,
			firstName: user.first_name,
			lastName: user.last_name,
			createdAt: user.created_at,
			updatedAt: user.updated_at,
			isActive: true,
		};
	}

	/**
	 * Handle Clerk error
	 */
	handleClerkError(error: unknown, context: { operation: string; userId?: string }): never {
		this.logger.error('Clerk operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			userId: context.userId,
		});

		throw AppError.externalService('CLERK_SERVICE_ERROR', ErrorCodes.CLERK_SERVICE_ERROR, {
			operation: context.operation,
			userId: context.userId,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

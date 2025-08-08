import { AppError } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';

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
		try {
			if (!data || typeof data !== 'object') return false;
			const { id } = data as { id: string };
			return typeof id === 'string' && id.length > 0;
		} catch (error) {
			this.logger.error('Failed to validate user identity', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Validate Clerk user data
	 */
	validateClerkUser(data: unknown): data is Marketplace.External.ClerkUser {
		try {
			if (!data || typeof data !== 'object') return false;
			const user = data as Marketplace.External.ClerkUser;

			return (
				typeof user.id === 'string' &&
				Array.isArray(user.email_addresses) &&
				user.email_addresses.every(
					(email) =>
						typeof email.email_address === 'string' &&
						(!email.verification ||
							email.verification.status === 'verified' ||
							email.verification.status === 'unverified'),
				) &&
				(!user.first_name || typeof user.first_name === 'string') &&
				(!user.last_name || typeof user.last_name === 'string') &&
				typeof user.created_at === 'string' &&
				typeof user.updated_at === 'string'
			);
		} catch (error) {
			this.logger.error('Failed to validate Clerk user', {
				error: error.message,
				data,
			});
			return false;
		}
	}

	/**
	 * Convert Clerk user to domain user
	 */
	toDomainUser(user: Marketplace.External.ClerkUser): Marketplace.Core.User {
		return {
			id: user.id,
			email: user.email_addresses[0]?.email_address || null,
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

		throw AppError.internal('CLERK_SERVICE_ERROR', 'Clerk operation failed', context);
	}
}

import { Injectable } from '@nestjs/common';
import { UserVendorResult } from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, PrismaService } from '@venta/nest/modules';

/**
 * Core service for user-management operations
 */
@Injectable()
export class CoreService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(CoreService.name);
	}

	/**
	 * Handle user identity creation from external auth provider
	 * Domain method for user identity management with business logic
	 */
	async handleUserCreated(id: string): Promise<{ clerkId: string; id: string } | null> {
		this.logger.log('Handling user identity creation from external auth provider', { clerkId: id });

		try {
			const userExists = await this.prisma.db.user.count({
				where: {
					clerkId: id,
				},
			});

			if (!userExists) {
				const user = await this.prisma.db.user.create({
					data: {
						clerkId: id,
					},
					select: { clerkId: true, id: true },
				});

				this.logger.log('User identity created successfully from external auth provider', {
					clerkId: id,
					userId: user.id,
				});

				return user;
			} else {
				this.logger.log('User identity already exists', { clerkId: id });
				return await this.prisma.db.user.findFirst({
					select: { clerkId: true, id: true },
					where: { clerkId: id },
				});
			}
		} catch (error) {
			this.logger.error('Failed to handle user identity creation', error.stack, { clerkId: id, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'handle_user_created',
				clerkId: id,
			});
		}
	}

	/**
	 * Handle user identity deletion from external auth provider
	 * Domain method for user identity cleanup with business logic
	 */
	async handleUserDeleted(clerkId: string): Promise<void> {
		this.logger.log('Handling user identity deletion from external auth provider', { clerkId });

		try {
			// Get user before deletion for potential event emission
			const user = await this.prisma.db.user.findFirst({
				select: { clerkId: true, id: true },
				where: { clerkId },
			});

			if (user) {
				await this.prisma.db.user.deleteMany({
					where: {
						clerkId,
					},
				});

				this.logger.log('User identity deleted successfully from external auth provider', {
					clerkId,
					userId: user.id,
				});
			} else {
				this.logger.log('User identity not found for deletion', { clerkId });
			}
		} catch (error) {
			this.logger.error('Failed to handle user identity deletion', error.stack, { clerkId, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'handle_user_deleted',
				clerkId,
			});
		}
	}

	/**
	 * Get vendors associated with a user by user ID
	 */
	async getUserVendors(userId: string): Promise<UserVendorResult[]> {
		this.logger.debug('Getting vendors for user', { userId });
		try {
			const user = await this.prisma.db.user.findUnique({
				where: {
					id: userId,
				},
				include: {
					vendors: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			if (!user) {
				throw AppError.notFound(ErrorCodes.ERR_ENTITY_NOT_FOUND, {
					entityType: 'user',
					entityId: userId,
				});
			}

			this.logger.debug('Vendors retrieved successfully for user', {
				userId,
				vendorCount: user.vendors.length,
			});

			return user.vendors;
		} catch (error) {
			this.logger.error('Failed to get vendors for user', { error: error.message, userId });
			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_vendors',
				userId,
			});
		}
	}
}

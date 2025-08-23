import { Injectable } from '@nestjs/common';
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
		this.logger.debug('Handling user identity creation from external auth provider', { clerkId: id });

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

				this.logger.debug('User identity created successfully from external auth provider', {
					clerkId: id,
					userId: user.id,
				});

				return user;
			} else {
				this.logger.debug('User identity already exists', { clerkId: id });
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
		this.logger.debug('Handling user identity deletion from external auth provider', { clerkId });

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

				this.logger.debug('User identity deleted successfully from external auth provider', {
					clerkId,
					userId: user.id,
				});
			} else {
				this.logger.debug('User identity not found for deletion', { clerkId });
			}
		} catch (error) {
			this.logger.error('Failed to handle user identity deletion', error.stack, { clerkId, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'handle_user_deleted',
				clerkId,
			});
		}
	}
}

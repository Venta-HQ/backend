import { Injectable, Logger } from '@nestjs/common';
import { UserVendorResult } from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrismaService } from '@venta/nest/modules';

/**
 * Core service for user-management operations
 */
@Injectable()
export class CoreService {
	private readonly logger = new Logger(CoreService.name);

	constructor(private readonly prisma: PrismaService) {}

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

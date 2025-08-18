import { Injectable } from '@nestjs/common';
import { UserVendorResult } from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, PrismaService } from '@venta/nest/modules';

@Injectable()
export class VendorService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(VendorService.name);
	}

	async getUserVendors(userId: string): Promise<UserVendorResult[]> {
		this.logger.debug('Getting vendors for user', { userId });
		try {
			const user = await this.prisma.db.user.findUnique({
				where: { id: userId },
				include: {
					vendors: { select: { id: true, name: true } },
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
			this.logger.error('Failed to get vendors for user', (error as Error).stack, {
				error: (error as Error).message,
				userId,
			});
			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_vendors',
				userId,
			});
		}
	}
}

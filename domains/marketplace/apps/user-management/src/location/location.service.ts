import { Injectable, Logger } from '@nestjs/common';
import type { UserLocationUpdate } from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrismaService } from '@venta/nest/modules';

/**
 * Location service for user-management operations
 */
@Injectable()
export class LocationService {
	private readonly logger = new Logger(LocationService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Update user location
	 */
	async updateUserLocation(request: UserLocationUpdate): Promise<{ id: string; lat: number; lng: number }> {
		this.logger.debug('Updating user location', {
			userId: request.userId,
			location: request.location,
		});

		try {
			const user = await this.prisma.db.user.update({
				where: { id: request.userId },
				data: {
					lat: request.location.lat,
					long: request.location.long, // Note: database uses 'long', domain uses 'lng'
				},
			});

			this.logger.debug('User location updated successfully', {
				userId: request.userId,
				lat: user.lat,
				lng: user.long,
			});

			return {
				id: user.id,
				lat: user.lat,
				lng: user.long,
			};
		} catch (error) {
			this.logger.error('Failed to update user location', {
				error: error.message,
				userId: request.userId,
			});
			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'update_user_location',
				userId: request.userId,
			});
		}
	}
}

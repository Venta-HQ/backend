import { AppError, ErrorCodes } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
	) {}

	/**
	 * Update user location from location service events
	 * This method is called when the location service publishes a user.location.updated event
	 * It doesn't require user authorization since it's a system-level operation
	 */
	async updateUserLocation(userId: string, location: { lat: number; long: number }) {
		this.logger.log(`Updating user location from location service: ${userId}`);

		try {
			// Update user location in database
			const user = await this.prisma.db.user.update({
				data: {
					lat: location.lat,
					long: location.long,
				},
				where: {
					id: userId,
				},
			});

			this.logger.log(`Updated user location in database: ${userId} at (${location.lat}, ${location.long})`);
			return user;
		} catch (e) {
			this.logger.error(`Failed to update user location in database for ${userId}:`, e);
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update user location in database' });
		}
	}
}

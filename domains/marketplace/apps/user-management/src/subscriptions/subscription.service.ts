import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SubscriptionProvider, SubscriptionStatus } from '@prisma/client';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrismaService } from '@venta/nest/modules';

interface UserSubscriptionData {
	clerkUserId: string;
}

@Injectable()
export class SubscriptionService {
	private readonly logger = new Logger(SubscriptionService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Create user subscription record (legacy method)
	 */
	async createUserSubscription(data: UserSubscriptionData): Promise<void> {
		this.logger.log('Creating user subscription record', {
			clerkUserId: data.clerkUserId,
		});

		try {
			await this.prisma.db.userSubscription.create({
				data: {
					status: SubscriptionStatus.active,
					provider: SubscriptionProvider.revenuecat,
					externalId: 'unknown', // TODO: Figure this out
					productId: 'unknown', // TODO: Figure this out
					startDate: new Date().toISOString(),
					user: {
						connect: {
							clerkId: data.clerkUserId,
						},
					},
				},
			});

			this.logger.log('User subscription record created successfully', {
				clerkUserId: data.clerkUserId,
			});
		} catch (error) {
			this.logger.error('Failed to create user subscription record', error.stack, {
				clerkUserId: data.clerkUserId,
				error,
			});
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_user_subscription',
				clerkUserId: data.clerkUserId,
			});
		}
	}
}

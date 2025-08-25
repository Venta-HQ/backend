import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import type { SubscriptionCreate } from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, PrismaService } from '@venta/nest/modules';

type UserSubscriptionData = SubscriptionCreate;

@Injectable()
export class SubscriptionService {
	constructor(
		private prisma: PrismaService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(SubscriptionService.name);
	}

	/**
	 * Create user subscription record
	 */
	async createUserSubscription(data: UserSubscriptionData): Promise<void> {
		this.logger.debug('Creating user subscription record', {
			clerkUserId: data.userId,
			provider: data.provider,
			productId: data.data.productId,
			transactionId: data.data.transactionId,
		});

		try {
			await this.prisma.db.userSubscription.create({
				data: {
					status: SubscriptionStatus.active,
					provider: data.provider,
					externalId: data.data.transactionId,
					productId: data.data.productId,
					startDate: new Date().toISOString(),
					user: {
						connect: {
							clerkId: data.userId,
						},
					},
				},
			});

			this.logger.debug('User subscription record created successfully', {
				clerkUserId: data.userId,
			});
		} catch (error) {
			this.logger.error('Failed to create user subscription record', (error as Error).stack, {
				clerkUserId: data.userId,
				error,
			});
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_user_subscription',
				clerkUserId: data.userId,
			});
		}
	}
}

import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionProvider, SubscriptionStatus } from '@prisma/client';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, PrismaService } from '@venta/nest/modules';
import { SubscriptionProvider as GrpcSubscriptionProvider } from '@venta/proto/marketplace/user-management';

interface UserSubscriptionData {
	clerkUserId: string;
	provider: number; // gRPC enum value
	data: {
		eventId: string;
		productId: string;
		transactionId: string;
	};
}

function mapGrpcProviderToPrisma(provider: number): SubscriptionProvider {
	switch (provider) {
		case GrpcSubscriptionProvider.REVENUECAT:
			return SubscriptionProvider.revenuecat;
		default:
			return SubscriptionProvider.revenuecat;
	}
}

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
			clerkUserId: data.clerkUserId,
			provider: data.provider,
			productId: data.data.productId,
			transactionId: data.data.transactionId,
		});

		try {
			const providerEnum = mapGrpcProviderToPrisma(data.provider);

			await this.prisma.db.userSubscription.create({
				data: {
					status: SubscriptionStatus.active,
					provider: providerEnum,
					externalId: data.data.transactionId,
					productId: data.data.productId,
					startDate: new Date().toISOString(),
					user: {
						connect: {
							clerkId: data.clerkUserId,
						},
					},
				},
			});

			this.logger.debug('User subscription record created successfully', {
				clerkUserId: data.clerkUserId,
			});
		} catch (error) {
			this.logger.error('Failed to create user subscription record', (error as Error).stack, {
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

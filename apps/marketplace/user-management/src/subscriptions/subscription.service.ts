import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';
import { IntegrationType, Prisma, SubscriptionStatus } from '@prisma/client';

interface IntegrationData {
	clerkUserId: string;
	data?: Prisma.InputJsonValue;
	providerId?: string;
}

interface UserSubscriptionData {
	clerkUserId: string;
}

interface SubscriptionActivationData {
	clerkUserId: string;
	providerId: string;
	subscriptionData?: Prisma.InputJsonValue;
}

@Injectable()
export class SubscriptionService {
	private readonly logger = new Logger(SubscriptionService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Activate user subscription with integration
	 * Domain method for subscription activation with business logic
	 */
	async activateSubscription(activationData: SubscriptionActivationData): Promise<void> {
		this.logger.log('Starting subscription activation process', {
			clerkUserId: activationData.clerkUserId,
			providerId: activationData.providerId,
		});

		try {
			// Create integration record
			await this.prisma.db.integration.create({
				data: {
					data: activationData.subscriptionData as any,
					providerId: activationData.providerId,
					type: IntegrationType.RevenueCat,
					user: {
						connect: {
							clerkId: activationData.clerkUserId,
						},
					},
				},
			});

			// Create user subscription record
			await this.prisma.db.userSubscription.create({
				data: {
					status: SubscriptionStatus.Active,
					user: {
						connect: {
							clerkId: activationData.clerkUserId,
						},
					},
				},
			});

			this.logger.log('Subscription activation completed successfully', {
				clerkUserId: activationData.clerkUserId,
				providerId: activationData.providerId,
			});
		} catch (error) {
			this.logger.error('Failed to activate subscription', {
				clerkUserId: activationData.clerkUserId,
				error,
				providerId: activationData.providerId,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to activate subscription', {
				clerkUserId: activationData.clerkUserId,
				operation: 'activate_subscription',
				providerId: activationData.providerId,
			});
		}
	}

	/**
	 * Handle user creation from external auth provider
	 */
	async handleUserCreated(clerkId: string): Promise<void> {
		this.logger.log('Handling user creation from external auth provider', { clerkId });

		try {
			await this.prisma.db.user.create({
				data: {
					clerkId,
				},
			});

			this.logger.log('User created successfully from external auth provider', { clerkId });
		} catch (error) {
			this.logger.error('Failed to create user from external auth provider', { clerkId, error });
			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.DATABASE_ERROR,
				'Failed to create user from external auth provider',
				{
					clerkId,
					operation: 'handle_user_created',
				},
			);
		}
	}

	/**
	 * Handle user deletion from external auth provider
	 */
	async handleUserDeleted(clerkId: string): Promise<void> {
		this.logger.log('Handling user deletion from external auth provider', { clerkId });

		try {
			await this.prisma.db.user.deleteMany({
				where: {
					clerkId,
				},
			});

			this.logger.log('User deleted successfully from external auth provider', { clerkId });
		} catch (error) {
			this.logger.error('Failed to delete user from external auth provider', { clerkId, error });
			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.DATABASE_ERROR,
				'Failed to delete user from external auth provider',
				{
					clerkId,
					operation: 'handle_user_deleted',
				},
			);
		}
	}

	/**
	 * Create integration record for subscription provider (legacy method)
	 */
	async createIntegration(data: IntegrationData): Promise<void> {
		this.logger.log('Creating integration record for subscription provider', {
			clerkUserId: data.clerkUserId,
			providerId: data.providerId,
			type: IntegrationType.RevenueCat,
		});

		try {
			await this.prisma.db.integration.create({
				data: {
					data: data.data as any,
					providerId: data.providerId,
					type: IntegrationType.RevenueCat,
					user: {
						connect: {
							clerkId: data.clerkUserId,
						},
					},
				},
			});

			this.logger.log('Integration record created successfully', {
				clerkUserId: data.clerkUserId,
				providerId: data.providerId,
			});
		} catch (error) {
			this.logger.error('Failed to create integration record', { clerkUserId: data.clerkUserId, error });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create integration record', {
				clerkUserId: data.clerkUserId,
				operation: 'create_integration',
			});
		}
	}

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
					status: SubscriptionStatus.Active,
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
			this.logger.error('Failed to create user subscription record', { clerkUserId: data.clerkUserId, error });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create user subscription record', {
				clerkUserId: data.clerkUserId,
				operation: 'create_user_subscription',
			});
		}
	}
}

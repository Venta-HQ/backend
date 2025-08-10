import { Injectable, Logger } from '@nestjs/common';
import { IntegrationType, Prisma } from '@prisma/client';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrismaService } from '@venta/nest/modules';

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
			// Expect validated subscription data from controller
			const subscriptionData = activationData.subscriptionData;

			// Create integration record
			await this.prisma.db.integration.create({
				data: {
					data: subscriptionData as any,
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
					status: 'active' as any,
					provider: 'revenuecat' as any,
					externalId: 'unknown',
					productId: 'unknown',
					startDate: new Date().toISOString() as any,
					user: {
						connect: {
							clerkId: validatedSubscriptionData.clerkUserId,
						},
					},
				},
			});

			this.logger.log('Subscription activation completed successfully', {
				clerkUserId: validatedSubscriptionData.clerkUserId,
				providerId: validatedSubscriptionData.providerId,
			});
		} catch (error) {
			this.logger.error('Failed to activate subscription', {
				clerkUserId: activationData.clerkUserId,
				error,
				providerId: activationData.providerId,
			});
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'activate_subscription',
				clerkUserId: activationData.clerkUserId,
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
			this.logger.error('Failed to create user from external auth provider', error.stack, { clerkId, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'handle_user_created',
				clerkId,
			});
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
			this.logger.error('Failed to delete user from external auth provider', error.stack, { clerkId, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'handle_user_deleted',
				clerkId,
			});
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
			this.logger.error('Failed to create integration record', error.stack, { clerkUserId: data.clerkUserId, error });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_integration',
				clerkUserId: data.clerkUserId,
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
					status: 'active' as any,
					provider: 'revenuecat' as any,
					externalId: 'unknown',
					productId: 'unknown',
					startDate: new Date().toISOString() as any,
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

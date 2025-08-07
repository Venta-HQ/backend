import { UserDomainError, UserDomainErrorCodes } from '@app/nest/errors';
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

@Injectable()
export class SubscriptionService {
	private readonly logger = new Logger(SubscriptionService.name);

	constructor(private prisma: PrismaService) {}

	/**
	 * Handle user creation from external auth provider
	 */
	async handleUserCreated(clerkId: string): Promise<void> {
		this.logger.log('Handling user creation from external auth provider', { clerkId });

		// Domain validation
		await this.validateUserDoesNotExist(clerkId);

		try {
			await this.prisma.db.user.create({
				data: {
					clerkId,
				},
			});

			this.logger.log('User created successfully from external auth provider', { clerkId });
		} catch (error) {
			this.logger.error('Failed to create user from external auth provider', { clerkId, error });
			throw new UserDomainError(
				UserDomainErrorCodes.DATABASE_ERROR,
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

		// Domain validation
		await this.validateUserExists(clerkId);

		try {
			await this.prisma.db.user.deleteMany({
				where: {
					clerkId,
				},
			});

			this.logger.log('User deleted successfully from external auth provider', { clerkId });
		} catch (error) {
			this.logger.error('Failed to delete user from external auth provider', { clerkId, error });
			throw new UserDomainError(
				UserDomainErrorCodes.DATABASE_ERROR,
				'Failed to delete user from external auth provider',
				{
					clerkId,
					operation: 'handle_user_deleted',
				},
			);
		}
	}

	/**
	 * Create integration record for subscription provider
	 */
	async createIntegration(data: IntegrationData): Promise<void> {
		this.logger.log('Creating integration record for subscription provider', {
			clerkUserId: data.clerkUserId,
			providerId: data.providerId,
			type: IntegrationType.RevenueCat,
		});

		// Domain validation
		await this.validateUserExists(data.clerkUserId);
		await this.validateIntegrationData(data);

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
			throw new UserDomainError(UserDomainErrorCodes.DATABASE_ERROR, 'Failed to create integration record', {
				clerkUserId: data.clerkUserId,
				operation: 'create_integration',
			});
		}
	}

	/**
	 * Create user subscription record
	 */
	async createUserSubscription(data: UserSubscriptionData): Promise<void> {
		this.logger.log('Creating user subscription record', {
			clerkUserId: data.clerkUserId,
		});

		// Domain validation
		await this.validateUserExists(data.clerkUserId);
		await this.validateSubscriptionDoesNotExist(data.clerkUserId);

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
			throw new UserDomainError(UserDomainErrorCodes.DATABASE_ERROR, 'Failed to create user subscription record', {
				clerkUserId: data.clerkUserId,
				operation: 'create_user_subscription',
			});
		}
	}

	/**
	 * Validate that user exists
	 */
	private async validateUserExists(clerkId: string): Promise<void> {
		const user = await this.prisma.db.user.findUnique({
			where: { clerkId },
		});

		if (!user) {
			throw new UserDomainError(UserDomainErrorCodes.USER_NOT_FOUND, 'User not found', {
				clerkId,
			});
		}
	}

	/**
	 * Validate that user does not exist
	 */
	private async validateUserDoesNotExist(clerkId: string): Promise<void> {
		const existingUser = await this.prisma.db.user.findUnique({
			where: { clerkId },
		});

		if (existingUser) {
			throw new UserDomainError(UserDomainErrorCodes.USER_ALREADY_EXISTS, 'User already exists', {
				clerkId,
			});
		}
	}

	/**
	 * Validate that subscription does not exist for user
	 */
	private async validateSubscriptionDoesNotExist(clerkId: string): Promise<void> {
		const existingSubscription = await this.prisma.db.userSubscription.findFirst({
			where: {
				user: {
					clerkId,
				},
			},
		});

		if (existingSubscription) {
			throw new UserDomainError(
				UserDomainErrorCodes.SUBSCRIPTION_NOT_FOUND,
				'User already has an active subscription',
				{
					clerkId,
				},
			);
		}
	}

	/**
	 * Validate integration data according to domain rules
	 */
	private async validateIntegrationData(data: IntegrationData): Promise<void> {
		if (!data.clerkUserId || data.clerkUserId.trim().length === 0) {
			throw new UserDomainError(UserDomainErrorCodes.PROFILE_INCOMPLETE, 'Clerk user ID is required', {
				clerkUserId: data.clerkUserId,
			});
		}

		if (data.providerId && data.providerId.trim().length === 0) {
			throw new UserDomainError(UserDomainErrorCodes.PROFILE_INCOMPLETE, 'Provider ID cannot be empty if provided', {
				providerId: data.providerId,
			});
		}
	}
}

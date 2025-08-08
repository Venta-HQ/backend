import { AppError, ErrorCodes } from '@app/nest/errors';
import { GrpcAuthGuard } from '@app/nest/guards';
import {
	CreateSubscriptionData,
	CreateSubscriptionResponse,
	CreateUserResponse,
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	UserIdentityData,
	UserManagementServiceController,
	UserVendorData,
	UserVendorsResponse,
} from '@app/proto/marketplace/user-management';
import { ClerkAntiCorruptionLayer } from '@domains/marketplace/contracts/anti-corruption-layers/clerk-anti-corruption-layer';
import { RevenueCatAntiCorruptionLayer } from '@domains/marketplace/contracts/anti-corruption-layers/revenuecat-anti-corruption-layer';
import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserManagementService } from './user-management.service';

/**
 * gRPC controller for user management service
 */
@Controller()
@UseGuards(GrpcAuthGuard)
export class UserManagementController implements UserManagementServiceController {
	private readonly logger = new Logger(UserManagementController.name);

	constructor(
		private readonly userManagementService: UserManagementService,
		private readonly clerkACL: ClerkAntiCorruptionLayer,
		private readonly revenueCatACL: RevenueCatAntiCorruptionLayer,
	) {}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleUserCreated')
	async handleUserCreated(request: UserIdentityData): Promise<CreateUserResponse> {
		this.logger.debug('Processing user creation request', {
			userId: request.id,
		});

		try {
			// Validate request
			if (!this.clerkACL.validateUserIdentity(request as unknown)) {
				throw AppError.validation(ErrorCodes.ERR_USER_INVALID_DATA, {
					userId: request.id,
				});
			}

			// Register user
			await this.userManagementService.registerUser({
				clerkId: request.id,
				source: 'clerk_webhook',
			});

			this.logger.debug('User created successfully', {
				userId: request.id,
			});

			return { message: 'User created successfully' };
		} catch (error) {
			this.logger.error('Failed to create user', {
				error: error.message,
				userId: request.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_USER_CREATE, {
				userId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleUserDeleted')
	async handleUserDeleted(request: UserIdentityData): Promise<CreateUserResponse> {
		this.logger.debug('Processing user deletion request', {
			userId: request.id,
		});

		try {
			// Validate request
			if (!this.clerkACL.validateUserIdentity(request as unknown)) {
				throw AppError.validation(ErrorCodes.ERR_USER_INVALID_DATA, {
					userId: request.id,
				});
			}

			// Delete user
			await this.userManagementService.deleteUserProfile(request.id);

			this.logger.debug('User deleted successfully', {
				userId: request.id,
			});

			return { message: 'User deleted successfully' };
		} catch (error) {
			this.logger.error('Failed to delete user', {
				error: error.message,
				userId: request.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_USER_DELETE, {
				userId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleSubscriptionCreated')
	async handleSubscriptionCreated(request: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
		this.logger.debug('Processing subscription creation request', {
			userId: request.clerkUserId,
			subscriptionData: request.data,
		});

		try {
			// Validate request
			if (!this.revenueCatACL.validateSubscriptionData(request.data as unknown)) {
				throw AppError.validation(ErrorCodes.ERR_SUB_INVALID_DATA, {
					userId: request.clerkUserId,
				});
			}

			// Convert to domain model
			const subscription = this.revenueCatACL.toDomainSubscription({
				id: request.data.eventId,
				user_id: request.clerkUserId,
				product_id: request.data.productId,
				transaction_id: request.data.transactionId,
				status: 'active',
				period_type: 'normal',
				purchased_at: new Date().toISOString(),
			} as Marketplace.External.RevenueCatSubscription);

			// TODO: Implement subscription handling in UserManagementService
			// await this.userManagementService.createSubscription(subscription);

			this.logger.debug('Subscription created successfully', {
				userId: request.clerkUserId,
				subscriptionId: subscription.id,
			});

			return { message: 'Subscription created successfully' };
		} catch (error) {
			this.logger.error('Failed to create subscription', {
				error: error.message,
				userId: request.clerkUserId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_SUB_CREATE, {
				userId: request.clerkUserId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'getUserVendors')
	async getUserVendors(request: UserVendorData): Promise<UserVendorsResponse> {
		this.logger.debug('Processing user vendors request', {
			userId: request.userId,
		});

		try {
			// TODO: Implement vendor retrieval in UserManagementService
			// const vendors = await this.userManagementService.getUserVendors(request.userId);

			this.logger.debug('User vendors retrieved successfully', {
				userId: request.userId,
				vendorCount: 0,
			});

			return { vendors: [] };
		} catch (error) {
			this.logger.error('Failed to get user vendors', {
				error: error.message,
				userId: request.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_USER_VENDORS_FETCH, {
				userId: request.userId,
			});
		}
	}
}

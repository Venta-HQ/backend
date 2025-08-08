import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
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
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserManagementService } from './user-management.service';

/**
 * gRPC controller for user management service
 * Implements the service interface generated from proto/marketplace/user-management.proto
 */
@Controller()
export class UserManagementController implements UserManagementServiceController {
	private readonly logger = new Logger(UserManagementController.name);

	constructor(private readonly userManagementService: UserManagementService) {}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleUserCreated')
	async handleUserCreated(request: UserIdentityData): Promise<CreateUserResponse> {
		this.logger.debug('Handling user created event', { userId: request.id });

		try {
			await this.userManagementService.registerUser({ clerkId: request.id, source: 'clerk_webhook' });
			return { message: 'User created successfully' };
		} catch (error) {
			this.logger.error('Failed to handle user creation', {
				userId: request.id,
				error: error.message,
			});

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to handle user creation', {
				userId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleUserDeleted')
	async handleUserDeleted(request: UserIdentityData): Promise<CreateUserResponse> {
		this.logger.debug('Handling user deleted event', { userId: request.id });

		try {
			await this.userManagementService.deleteUserProfile(request.id);
			return { message: 'User deleted successfully' };
		} catch (error) {
			this.logger.error('Failed to handle user deletion', {
				userId: request.id,
				error: error.message,
			});

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to handle user deletion', {
				userId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleSubscriptionCreated')
	async handleSubscriptionCreated(request: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
		this.logger.debug('Handling subscription created event', {
			userId: request.clerkUserId,
			subscriptionData: request.data,
		});

		try {
			// TODO: Implement subscription handling in UserManagementService
			return { message: 'Subscription created successfully' };
		} catch (error) {
			this.logger.error('Failed to handle subscription creation', {
				userId: request.clerkUserId,
				error: error.message,
			});

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to handle subscription creation', {
				userId: request.clerkUserId,
				subscriptionData: request.data,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'getUserVendors')
	async getUserVendors(request: UserVendorData): Promise<UserVendorsResponse> {
		this.logger.debug('Getting user vendors', { userId: request.userId });

		try {
			// TODO: Implement vendor retrieval in UserManagementService
			return { vendors: [] };
		} catch (error) {
			this.logger.error('Failed to get user vendors', {
				userId: request.userId,
				error: error.message,
			});

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to get user vendors', {
				userId: request.userId,
			});
		}
	}
}

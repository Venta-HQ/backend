import { Controller, Logger, UseGuards, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionCreateACLPipe, UserIdentityACLPipe } from '@venta/domains/marketplace/contracts';
// Domain types (what gRPC maps to)
import type { SubscriptionCreate, UserIdentity } from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
// gRPC types (wire format)
import {
	CreateSubscriptionResponse,
	CreateUserResponse,
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	UserManagementServiceController,
	UserVendorData,
	UserVendorsResponse,
} from '@venta/proto/marketplace/user-management';
import { UserManagementService } from './user-management.service';

/**
 * gRPC controller for user management service
 */
@Controller()
@UseGuards(GrpcAuthGuard)
export class UserManagementController implements UserManagementServiceController {
	private readonly logger = new Logger(UserManagementController.name);

	constructor(private readonly userManagementService: UserManagementService) {}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleUserCreated')
	@UsePipes(UserIdentityACLPipe)
	async handleUserCreated(request: UserIdentity): Promise<CreateUserResponse> {
		this.logger.debug('Processing user creation request', {
			userId: request.id,
		});

		try {
			// Register user (validation handled by pipe)
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
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_user',
				userId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleUserDeleted')
	@UsePipes(UserIdentityACLPipe)
	async handleUserDeleted(request: UserIdentity): Promise<CreateUserResponse> {
		this.logger.debug('Processing user deletion request', {
			userId: request.id,
		});

		try {
			await this.userManagementService.deleteUser(request.id);

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
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'delete_user',
				userId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleSubscriptionCreated')
	@UsePipes(SubscriptionCreateACLPipe)
	async handleSubscriptionCreated(request: SubscriptionCreate): Promise<CreateSubscriptionResponse> {
		this.logger.debug('Processing subscription creation request', {
			userId: request.userId,
			providerId: request.providerId,
		});

		try {
			// Create subscription (validation handled by pipe)
			await this.userManagementService.createSubscription(request);

			this.logger.debug('Subscription created successfully', {
				userId: request.userId,
			});

			return { message: 'Subscription created successfully' };
		} catch (error) {
			this.logger.error('Failed to create subscription', {
				error: error.message,
				userId: request.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_subscription',
				userId: request.userId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'getUserVendors')
	async getUserVendors(request: UserVendorData): Promise<UserVendorsResponse> {
		this.logger.debug('Retrieving user vendors', {
			userId: request.userId,
		});

		try {
			const vendors = await this.userManagementService.getUserVendors(request.userId);

			this.logger.debug('Retrieved user vendors successfully', {
				userId: request.userId,
				vendorCount: vendors.length,
			});

			return {
				vendors: vendors.map((vendor) => ({
					id: vendor.id,
					name: vendor.name,
				})),
			};
		} catch (error) {
			this.logger.error('Failed to retrieve user vendors', {
				error: error.message,
				userId: request.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_vendors',
				userId: request.userId,
			});
		}
	}
}

import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionCreateACL, UserIdentityACL, UserVendorQueryACL } from '@venta/domains/marketplace/contracts';
// Domain types are now transformed by ACL, no longer needed as imports
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
// gRPC types (wire format)
import {
	CreateSubscriptionData,
	CreateSubscriptionResponse,
	CreateUserResponse,
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	UserIdentityData,
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
	async handleUserCreated(request: UserIdentityData): Promise<CreateUserResponse> {
		// Validate and transform request
		const domainRequest = UserIdentityACL.toDomain(request);
		this.logger.debug('Processing user creation request', {
			userId: domainRequest.id,
		});

		try {
			// Register user (validation handled by ACL)
			await this.userManagementService.registerUser({
				clerkId: domainRequest.id,
				source: 'clerk_webhook',
			});

			this.logger.debug('User created successfully', {
				userId: domainRequest.id,
			});

			return { message: 'User created successfully' };
		} catch (error) {
			this.logger.error('Failed to create user', {
				error: error.message,
				userId: domainRequest.id,
			});
			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_user',
				userId: domainRequest.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleUserDeleted')
	async handleUserDeleted(request: UserIdentityData): Promise<CreateUserResponse> {
		// Validate and transform request
		const domainRequest = UserIdentityACL.toDomain(request);

		this.logger.debug('Processing user deletion request', {
			userId: domainRequest.id,
		});

		try {
			await this.userManagementService.deleteUser(domainRequest.id);

			this.logger.debug('User deleted successfully', {
				userId: domainRequest.id,
			});

			return { message: 'User deleted successfully' };
		} catch (error) {
			this.logger.error('Failed to delete user', {
				error: error.message,
				userId: domainRequest.id,
			});
			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'delete_user',
				userId: domainRequest.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'handleSubscriptionCreated')
	async handleSubscriptionCreated(request: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
		// Validate and transform request
		const domainRequest = SubscriptionCreateACL.toDomain(request);

		this.logger.debug('Processing subscription creation request', {
			userId: domainRequest.userId,
			providerId: domainRequest.providerId,
		});

		try {
			// Create subscription (validation handled by ACL)
			await this.userManagementService.createSubscription(domainRequest);

			this.logger.debug('Subscription created successfully', {
				userId: domainRequest.userId,
				providerId: domainRequest.providerId,
			});

			return { message: 'Subscription created successfully' };
		} catch (error) {
			this.logger.error('Failed to create subscription', {
				error: error.message,
				userId: domainRequest.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_subscription',
				userId: domainRequest.userId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'getUserVendors')
	async getUserVendors(request: UserVendorData): Promise<UserVendorsResponse> {
		// Validate and transform request
		const domainRequest = UserVendorQueryACL.toDomain(request);

		this.logger.debug('Retrieving user vendors', {
			userId: domainRequest.userId,
		});

		try {
			const vendors = await this.userManagementService.getUserVendors(domainRequest.userId);

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

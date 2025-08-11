import { Empty } from 'libs/proto/src/lib/shared/common';
import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserIdentityACL, UserVendorQueryACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
// gRPC types (wire format)
import { USER_MANAGEMENT_SERVICE_NAME, UserIdentityData, VendorList } from '@venta/proto/marketplace/user-management';
import { CoreService } from './core.service';

/**
 * Core gRPC controller for user-management operations
 * Handles core user-management operations (getUserVendors)
 */
@Controller()
@UseGuards(GrpcAuthGuard)
export class CoreController {
	private readonly logger = new Logger(CoreController.name);

	constructor(private readonly coreService: CoreService) {}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async handleUserCreated(request: UserIdentityData): Promise<Empty> {
		// Transform and validate gRPC data to domain format
		const domainRequest = UserIdentityACL.toDomain(request);

		this.logger.log(`Handling User Created Event`, {
			userId: domainRequest.id,
		});

		try {
			await this.coreService.handleUserCreated(domainRequest.id);

			this.logger.log('User created successfully', {
				userId: domainRequest.id,
			});

			return;
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

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async handleUserDeleted(request: UserIdentityData): Promise<Empty> {
		// Transform and validate gRPC data to domain format
		const domainRequest = UserIdentityACL.toDomain(request);

		this.logger.log(`Handling User Deleted Event`, {
			userId: domainRequest.id,
		});

		try {
			await this.coreService.handleUserDeleted(domainRequest.id);

			this.logger.log('User deleted successfully', {
				userId: domainRequest.id,
			});

			return;
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

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async getUserVendors(request: UserIdentityData): Promise<VendorList> {
		// Validate and transform request
		const domainRequest = UserVendorQueryACL.toDomain(request);

		this.logger.debug('Retrieving user vendors', {
			userId: domainRequest.userId,
		});

		try {
			const vendors = await this.coreService.getUserVendors(domainRequest.userId);

			this.logger.debug('Retrieved user vendors successfully', {
				userId: domainRequest.userId,
				vendorCount: vendors.length,
			});

			return {
				vendors,
			};
		} catch (error) {
			this.logger.error('Failed to retrieve user vendors', {
				error: error.message,
				userId: domainRequest.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_vendors',
				userId: domainRequest.userId,
			});
		}
	}
}

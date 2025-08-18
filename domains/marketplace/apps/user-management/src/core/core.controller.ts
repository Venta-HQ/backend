import { Empty } from 'libs/proto/src/lib/shared/common';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserIdentityACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';
// gRPC types (wire format)
import { USER_MANAGEMENT_SERVICE_NAME, UserIdentityData } from '@venta/proto/marketplace/user-management';
import { CoreService } from './core.service';

/**
 * Core gRPC controller for user-management operations
 * Handles core user-management operations (getUserVendors)
 * Note: gRPC auth is handled via interceptors, not guards
 */
@Controller()
export class CoreController {
	constructor(
		private readonly coreService: CoreService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(CoreController.name);
	}

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
			this.logger.error('Failed to create user', error?.stack, {
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
			this.logger.error('Failed to delete user', error?.stack, {
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

	/* moved: getUserVendors handler extracted to vendors module */
}

import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserIdentityACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import {
	CreateUserResponse,
	USER_MANAGEMENT_SERVICE_NAME,
	UserIdentityData,
} from '@venta/proto/marketplace/user-management';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
	private readonly logger = new Logger(AuthController.name);

	constructor(private readonly authService: AuthService) {}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async handleUserCreated(request: UserIdentityData): Promise<CreateUserResponse> {
		// Transform and validate gRPC data to domain format
		const domainRequest = UserCreatedACL.toDomain(request);

		this.logger.log(`Handling User Created Event`, {
			userId: domainRequest.id,
		});

		try {
			const userData = await this.authService.handleUserCreated(domainRequest.id);
			if (userData && userData.id) {
				await this.authService.createIntegration({
					clerkUserId: userData.id,
					providerId: userData.clerkId,
				});
			}

			this.logger.log('User created successfully', {
				userId: domainRequest.id,
			});

			return { message: 'Success' };
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
	async handleUserDeleted(request: UserIdentityData): Promise<CreateUserResponse> {
		// Transform and validate gRPC data to domain format
		const domainRequest = UserIdentityACL.toDomain(request);

		this.logger.log(`Handling User Deleted Event`, {
			userId: domainRequest.id,
		});

		try {
			await this.authService.handleUserDeleted(domainRequest.id);
			await this.authService.deleteIntegration({
				providerId: domainRequest.id,
			});

			this.logger.log('User deleted successfully', {
				userId: domainRequest.id,
			});

			return { message: 'Success' };
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
}

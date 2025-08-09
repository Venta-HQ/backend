import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GrpcClerkUserDataSchema } from '@venta/apitypes';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
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
	@UsePipes(new SchemaValidatorPipe(GrpcClerkUserDataSchema))
	async handleUserCreated(data: UserIdentityData): Promise<CreateUserResponse> {
		this.logger.log(`Handling User Created Event`);
		const userData = await this.authService.handleUserCreated(data.id);
		if (userData && userData.id) {
			await this.authService.createIntegration({
				clerkUserId: userData.id,
				providerId: userData.clerkId,
			});
		}
		return { message: 'Success' };
	}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcClerkUserDataSchema))
	async handleUserDeleted(data: UserIdentityData): Promise<CreateUserResponse> {
		this.logger.log(`Handling User Deleted Event`);
		await this.authService.handleUserDeleted(data.id);
		await this.authService.deleteIntegration({
			providerId: data.id,
		});
		return { message: 'Success' };
	}
}

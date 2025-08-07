import { GrpcClerkUserDataSchema } from '@app/apitypes';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { ClerkUserData, ClerkWebhookResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
	private readonly logger = new Logger(AuthController.name);

	constructor(private readonly authService: AuthService) {}

	@GrpcMethod(USER_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcClerkUserDataSchema))
	async handleUserCreated(data: ClerkUserData): Promise<ClerkWebhookResponse> {
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

	@GrpcMethod(USER_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcClerkUserDataSchema))
	async handleUserDeleted(data: ClerkUserData): Promise<ClerkWebhookResponse> {
		this.logger.log(`Handling User Deleted Event`);
		await this.authService.handleUserDeleted(data.id);
		await this.authService.deleteIntegration({
			providerId: data.id,
		});
		return { message: 'Success' };
	}
}

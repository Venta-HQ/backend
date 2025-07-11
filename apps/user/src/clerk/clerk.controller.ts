import { ClerkUserData, ClerkWebhookResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClerkService } from './clerk.service';

@Controller()
export class ClerkController {
	private readonly logger = new Logger(ClerkController.name);

	constructor(private readonly clerkService: ClerkService) {}

	@GrpcMethod(USER_SERVICE_NAME)
	async handleClerkUserCreated(data: ClerkUserData): Promise<ClerkWebhookResponse> {
		this.logger.log(`Handling Clerk Webhook Event from Microservice`);
		const userData = await this.clerkService.handleUserCreated(data.id);
		if (userData.id) {
			await this.clerkService.createIntegration({
				providerId: userData.clerkId,
				userId: userData.id,
			});
		}
		return { message: 'Success' };
	}

	@GrpcMethod(USER_SERVICE_NAME)
	async handleClerkUserDeleted(data: ClerkUserData): Promise<ClerkWebhookResponse> {
		this.logger.log(`Handling Clerk Webhook Event from Microservice`);
		await this.clerkService.handleUserDeleted(data.id);
		await this.clerkService.deleteIntegration({
			providerId: data.id,
		});
		return { message: 'Success' };
	}
}

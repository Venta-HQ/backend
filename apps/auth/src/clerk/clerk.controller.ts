import { AUTH_SERVICE_NAME, ClerkWebhookEvent, ClerkWebhookResponse } from '@app/proto/auth';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClerkService } from './clerk.service';

@Controller()
export class ClerkController {
	private readonly logger = new Logger(ClerkController.name);

	constructor(private readonly clerkService: ClerkService) {}

	@GrpcMethod(AUTH_SERVICE_NAME)
	async handleClerkUserCreated(data: ClerkWebhookEvent): Promise<ClerkWebhookResponse> {
		this.logger.log(`Handling Clerk Webhook Event from Microservice: ${data.type}`);
		await this.clerkService.handleUserCreated(data.event.id);

		return { message: 'Success' };
	}

	@GrpcMethod(AUTH_SERVICE_NAME)
	async handleClerkUserDeleted(data: ClerkWebhookEvent): Promise<ClerkWebhookResponse> {
		this.logger.log(`Handling Clerk Webhook Event from Microservice: ${data.type}`);
		await this.clerkService.handleUserDeleted(data.event.id);

		return { message: 'Success' };
	}
}

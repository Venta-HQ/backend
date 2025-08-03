import { ClerkUserData, ClerkWebhookResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { IEventsService } from '@app/nest/modules';
import { Controller, Inject, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClerkService } from './clerk.service';

@Controller()
export class ClerkController {
	private readonly logger = new Logger(ClerkController.name);

	constructor(
		private readonly clerkService: ClerkService,
		@Inject('EventsService') private readonly eventsService: IEventsService,
	) {}

	@GrpcMethod(USER_SERVICE_NAME)
	async handleClerkUserCreated(data: ClerkUserData): Promise<ClerkWebhookResponse> {
		this.logger.log(`Handling Clerk Webhook Event from Microservice`);
		const userData = await this.clerkService.handleUserCreated(data.id);
		if (userData.id) {
			await this.clerkService.createIntegration({
				providerId: userData.clerkId,
				userId: userData.id,
			});

			// Publish user created event
			await this.eventsService.publishEvent('user.created', {
				userId: userData.id,
				clerkId: userData.clerkId,
				timestamp: new Date().toISOString(),
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

		// Publish user deleted event
		await this.eventsService.publishEvent('user.deleted', {
			clerkId: data.id,
			timestamp: new Date().toISOString(),
		});

		return { message: 'Success' };
	}
}

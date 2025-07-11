import GrpcInstance from 'libs/nest/modules/grpc-instance/grpc-instance.service';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';

@Controller()
export class ClerkWebhooksController {
	private readonly logger = new Logger(ClerkWebhooksController.name);

	constructor(@Inject(USER_SERVICE_NAME) private client: GrpcInstance<UserServiceClient>) {}

	@Post()
	handleClerkEvent(@Body() event: UserWebhookEvent) {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`);
		switch (event.type) {
			case 'user.created':
				return this.client.invoke('handleClerkUserCreated', {
					id: event.data.id,
				});
			case 'user.deleted':
				return this.client.invoke('handleClerkUserDeleted', {
					id: event.data.id,
				});
			default:
				this.logger.warn('Unhandled Event Type');
		}
	}
}

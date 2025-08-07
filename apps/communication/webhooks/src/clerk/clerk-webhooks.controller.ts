import { GrpcInstance } from '@app/nest/modules';
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
				if (event.data?.id) {
					return this.client.invoke('handleUserCreated', {
						id: event.data.id,
					});
				}
				break;
			case 'user.deleted':
				if (event.data?.id) {
					return this.client.invoke('handleUserDeleted', {
						id: event.data.id,
					});
				}
				break;
			default:
				this.logger.warn('Unhandled Event Type');
		}
		return { success: true };
	}
}

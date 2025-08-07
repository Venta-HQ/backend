import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';

@Controller()
export class ClerkWebhooksController {
	private readonly logger = new Logger(ClerkWebhooksController.name);

	constructor(@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>) {}

	@Post()
	handleClerkEvent(@Body() event: UserWebhookEvent) {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`, { eventType: event.type, eventId: event.data?.id });
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
				this.logger.warn('Unhandled Event Type', { eventType: event.type, eventId: event.data?.id });
		}
		return { success: true };
	}
}

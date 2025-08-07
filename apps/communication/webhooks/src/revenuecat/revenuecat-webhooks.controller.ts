import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';

@Controller()
export class RevenueCatWebhooksController {
	private readonly logger = new Logger(RevenueCatWebhooksController.name);

	constructor(@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>) {}

	@Post()
	handleRevenueCatEvent(@Body() event: any) {
		this.logger.log(`Handling RevenueCat Webhook Event: ${event.event.type}`, {
			eventType: event.event.type,
			eventId: event.event.id,
		});
		switch (event.event.type) {
			case 'INITIAL_PURCHASE':
				if (event.event.app_user_id) {
					return this.client.invoke('handleSubscriptionCreated', {
						clerkUserId: event.event.app_user_id,
						data: {
							eventId: event.event.id,
							productId: event.event.product_id,
							transactionId: event.event.transaction_id,
						},
						providerId: event.event.transaction_id,
					});
				}
				break;
			default:
				this.logger.warn('Unhandled Event Type', { eventType: event.event.type, eventId: event.event.id });
		}
		return { success: true };
	}
}

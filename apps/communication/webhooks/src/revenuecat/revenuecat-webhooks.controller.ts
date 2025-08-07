import { GrpcInstance } from '@app/nest/modules';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';

@Controller()
export class RevenueCatWebhooksController {
	private readonly logger = new Logger(RevenueCatWebhooksController.name);

	constructor(@Inject(USER_SERVICE_NAME) private client: GrpcInstance<UserServiceClient>) {}

	@Post()
	handleRevenueCatEvent(@Body() event: any) {
		this.logger.log(`Handling RevenueCat Webhook Event: ${event.event.type}`);
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
				this.logger.warn('Unhandled Event Type');
		}
		return { success: true };
	}
}

import {
	RevenueCatHandledEventTypes,
	RevenueCatInitialPurchaseEventData,
	RevenueCatWebhookEvent,
} from '@app/apitypes/lib/subscription/subscription.types';
import { GrpcInstance } from '@app/grpc';
import { RevenueCatSubscriptionData, USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';

@Controller()
export class SubscriptionWebhooksController {
	private readonly logger = new Logger(SubscriptionWebhooksController.name);

	constructor(@Inject(USER_SERVICE_NAME) private readonly client: GrpcInstance<UserServiceClient>) {}

	@Post()
	async handleSubscriptionCreated(@Body() body: RevenueCatWebhookEvent<RevenueCatInitialPurchaseEventData>) {
		this.logger.log(`Handling RevenueCat Webhook Event: ${body.event.type}`);
		let payload: RevenueCatSubscriptionData | undefined;
		switch (body.event.type) {
			case RevenueCatHandledEventTypes.INITIAL_PURCHASE:
				payload = {
					clerkUserId: body.event.subscriber_attributes.clerkUserId,
					providerId: body.event.product_id,
					data: {
						transactionId: body.event.transaction_id,
						eventId: body.event.id,
						productId: body.event.product_id,
					},
				};
				break;
			default:
				this.logger.warn(`Unhandled RevenueCat event type: ${body.event.type}`);
		}
		if (payload) {
			await this.client.invoke('handleSubscriptionCreated', payload).subscribe({
				error: (error: Error) => {
					this.logger.error('Failed to handle subscription created', error);
				},
				next: () => {
					this.logger.log('Successfully handled subscription created');
				},
			});
		}
	}
}

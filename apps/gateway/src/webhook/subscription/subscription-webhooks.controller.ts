import { GrpcRevenueCatSubscriptionDataSchema } from '@app/apitypes/lib/user/user.schemas';
import GrpcInstance from '@app/grpc';
import { RevenueCatSubscriptionData, SubscriptionCreatedResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class SubscriptionWebhooksController {
	private readonly logger = new Logger(SubscriptionWebhooksController.name);

	constructor(@Inject(USER_SERVICE_NAME) private readonly client: GrpcInstance<UserServiceClient>) {}

	@Post()
	async handleSubscriptionCreated(@Body() body: RevenueCatWebhookEvent<RevenueCatInitialPurchaseEventData>) {
		this.logger.log(`Handling RevenueCat Webhook Event: ${body.event.type}`);
		switch (body.event.type) {
			case RevenueCatHandledEventTypes.INITIAL_PURCHASE:
				this.client
					.invoke('handleSubscriptionCreated', {
						clerkUserId: body.event.subscriber_attributes.clerkUserId,
						data: {
							eventId: body.event.id,
							productId: body.event.product_id,
							transactionId: body.event.transaction_id,
						},
						providerId: body.event.app_user_id,
					})
					.subscribe();
				break;
			default:
				this.logger.warn('Unhandled Event Type');
				throw new Error('Failure');
		}
	}
}

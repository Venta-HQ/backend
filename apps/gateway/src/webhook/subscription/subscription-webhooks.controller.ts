import GrpcInstance from 'libs/nest/modules/grpc-instance/grpc-instance.service';
import {
	RevenueCatHandledEventTypes,
	RevenueCatInitialPurchaseEventData,
	RevenueCatWebhookEvent,
} from '@app/apitypes/lib/subscription/subscription.types';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';

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
				throw AppError.internal('Unhandled webhook event type');
		}
	}
}

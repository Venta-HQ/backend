import {
	RevenueCatHandledEventTypes,
	RevenueCatInitialPurchaseEventData,
	RevenueCatWebhookEvent,
} from '@app/apitypes/lib/subscription/subscription.types';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Body, Controller, Inject, Logger, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class SubscriptionWebhooksController implements OnModuleInit {
	private readonly logger = new Logger(SubscriptionWebhooksController.name);
	private userService: UserServiceClient;

	constructor(@Inject(USER_SERVICE_NAME) private client: ClientGrpc) {}

	onModuleInit() {
		this.userService = this.client.getService<UserServiceClient>('UserService');
	}

	@Post()
	async handleSubscriptionCreated(@Body() body: RevenueCatWebhookEvent<RevenueCatInitialPurchaseEventData>) {
		this.logger.log(`Handling RevenueCat Webhook Event: ${body.event.type}`);
		switch (body.event.type) {
			case RevenueCatHandledEventTypes.INITIAL_PURCHASE:
				await this.userService.handleSubscriptionCreated({
					clerkUserId: body.event.subscriber_attributes.clerkUserId,
					data: {
						eventId: body.event.id,
						productId: body.event.product_id,
						transactionId: body.event.transaction_id,
					},
					providerId: body.event.app_user_id,
				});
				break;
			default:
				this.logger.warn('Unhandled Event Type');
				throw new Error('Failure');
		}
	}
}

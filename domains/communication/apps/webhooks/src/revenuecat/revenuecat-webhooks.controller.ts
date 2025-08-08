import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';
import { Communication } from '../../../../contracts/types/context-mapping.types';

interface RevenueCatPayload {
	transaction_id: string;
	app_user_id: string;
	id: string;
	product_id: string;
}

@Controller()
export class RevenueCatWebhooksController {
	private readonly logger = new Logger(RevenueCatWebhooksController.name);

	constructor(@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>) {}

	@Post()
	async handleRevenueCatEvent(
		@Body() event: Communication.WebhookEvent<RevenueCatPayload>,
	): Promise<{ success: boolean }> {
		this.logger.log(`Handling RevenueCat Webhook Event: ${event.type}`, {
			eventType: event.type,
			source: event.source,
			timestamp: event.timestamp,
		});

		try {
			switch (event.type) {
				case 'INITIAL_PURCHASE': {
					const subscriptionEvent: Communication.SubscriptionEvent = {
						externalSubscriptionId: event.payload.transaction_id,
						service: 'revenuecat',
						type: 'created',
						timestamp: event.timestamp,
					};

					await this.client.invoke('handleSubscriptionCreated', {
						clerkUserId: event.payload.app_user_id,
						data: {
							eventId: event.payload.id,
							productId: event.payload.product_id,
							transactionId: subscriptionEvent.externalSubscriptionId,
						},
						providerId: subscriptionEvent.externalSubscriptionId,
					});
					break;
				}

				default:
					this.logger.warn('Unhandled Event Type', {
						eventType: event.type,
						source: event.source,
						timestamp: event.timestamp,
					});
			}

			return { success: true };
		} catch (error) {
			this.logger.error('Failed to handle RevenueCat webhook event', {
				error: error.message,
				eventType: event.type,
			});

			throw error; // Let the exception filter handle it
		}
	}
}

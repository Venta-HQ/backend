import { Body, Controller, Inject, Logger, Post, UseGuards } from '@nestjs/common';
import { RevenueCatWebhookACL, RevenueCatWebhookPayload } from '@venta/domains/communication/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SignedWebhookGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

@Controller()
export class RevenueCatController {
	private readonly logger = new Logger(RevenueCatController.name);

	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME)
		private readonly client: GrpcInstance<UserManagementServiceClient>,
	) {}

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.REVENUECAT_WEBHOOK_SECRET || ''))
	async handleRevenueCatEvent(@Body() event: RevenueCatWebhookPayload): Promise<{ message: string }> {
		this.logger.log(`Handling RevenueCat Webhook Event: ${event.event.type}`, {
			eventType: event.event.type,
			userId: event.event.app_user_id,
		});

		try {
			// Validate and transform webhook event
			const subscriptionEvent = RevenueCatWebhookACL.toSubscriptionEvent(event);

			switch (event.event.type) {
				case 'INITIAL_PURCHASE': {
					await this.client.invoke('handleSubscriptionCreated', {
						clerkUserId: subscriptionEvent.userId,
						data: {
							eventId: event.event.transaction_id,
							productId: event.event.product_id,
							transactionId: subscriptionEvent.subscriptionId,
						},
						providerId: subscriptionEvent.subscriptionId,
					});
					break;
				}

				default:
					throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
						field: 'event_type',
						message: `Unsupported event type: ${event.event.type}`,
						userId: event.event.app_user_id,
					});
			}

			return { message: 'Event processed successfully' };
		} catch (error) {
			this.logger.error('Failed to handle RevenueCat webhook event', {
				error: error instanceof Error ? error.message : 'Unknown error',
				eventType: event.event.type,
				userId: event.event.app_user_id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_WEBHOOK_ERROR, {
				source: 'revenuecat',
				eventType: event.event.type,
				userId: event.event.app_user_id,
			});
		}
	}
}

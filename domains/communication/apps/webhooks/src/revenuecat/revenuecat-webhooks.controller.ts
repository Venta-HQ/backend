import { AppError } from '@app/nest/errors';
import { SignedWebhookGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { Body, Controller, Headers, Inject, Logger, Post, UseGuards } from '@nestjs/common';
import { CommunicationToMarketplaceContextMapper } from '../../../../contracts/context-mappers/communication-to-marketplace-context-mapper';
import { Communication } from '../../../../contracts/types/context-mapping.types';
import { RevenueCatWebhookPayload } from '../../../../contracts/types/external/revenuecat.types';

@Controller()
export class RevenueCatWebhooksController {
	private readonly logger = new Logger(RevenueCatWebhooksController.name);

	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME)
		private readonly client: GrpcInstance<UserManagementServiceClient>,
		private readonly contextMapper: CommunicationToMarketplaceContextMapper,
	) {}

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.REVENUECAT_WEBHOOK_SECRET || ''))
	async handleRevenueCatEvent(@Body() event: RevenueCatWebhookPayload): Promise<{ message: string }> {
		this.logger.log(`Handling RevenueCat Webhook Event: ${event.event.type}`, {
			eventType: event.event.type,
			userId: event.event.app_user_id,
		});

		try {
			switch (event.event.type) {
				case 'INITIAL_PURCHASE': {
					const marketplaceEvent = this.contextMapper.toMarketplaceSubscriptionEvent({
						type: event.event.type,
						source: 'revenuecat',
						payload: event,
						timestamp: new Date(event.event.purchased_at_ms).toISOString(),
					});

					await this.client.invoke('handleSubscriptionCreated', {
						clerkUserId: marketplaceEvent.userId,
						data: {
							eventId: event.event.transaction_id,
							productId: event.event.product_id,
							transactionId: marketplaceEvent.subscriptionId,
						},
						providerId: marketplaceEvent.subscriptionId,
					});
					break;
				}

				default:
					this.logger.warn('Unhandled Event Type', {
						eventType: event.event.type,
						userId: event.event.app_user_id,
					});
			}

			return { message: 'Event processed successfully' };
		} catch (error) {
			this.logger.error('Failed to handle RevenueCat webhook event', {
				error: error.message,
				eventType: event.event.type,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('WEBHOOK_PROCESSING_FAILED', 'Failed to process webhook');
		}
	}
}

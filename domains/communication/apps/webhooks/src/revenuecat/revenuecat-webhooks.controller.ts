import { AppError, ErrorCodes } from '@app/nest/errors';
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
					try {
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
					} catch (error) {
						throw AppError.externalService('USER_OPERATION_FAILED', ErrorCodes.USER_OPERATION_FAILED, {
							operation: 'handle_revenuecat_initial_purchase',
							eventId: event.event.transaction_id,
							userId: event.event.app_user_id,
							error: error instanceof Error ? error.message : 'Unknown error',
						});
					}
					break;
				}

				default:
					throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
						operation: 'handle_revenuecat_event',
						eventType: event.event.type,
						userId: event.event.app_user_id,
						message: 'Unhandled webhook event type',
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
			throw AppError.internal('USER_OPERATION_FAILED', ErrorCodes.USER_OPERATION_FAILED, {
				operation: 'handle_revenuecat_event',
				eventType: event.event.type,
				userId: event.event.app_user_id,
			});
		}
	}
}

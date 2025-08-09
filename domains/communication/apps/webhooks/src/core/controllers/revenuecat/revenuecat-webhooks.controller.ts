import { Body, Controller, Headers, Inject, Logger, Post, UseGuards } from '@nestjs/common';
import { CommunicationToMarketplaceContextMapper } from '@venta/domains/communication/contracts/context-mappers/communication-to-marketplace.context-mapper';
import { Communication } from '@venta/domains/communication/contracts/types/context-mapping.types';
import { RevenueCatWebhookPayload } from '@venta/domains/communication/contracts/types/external/revenuecat.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SignedWebhookGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

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
	async handleRevenueCatEvent(
		@Body(new SchemaValidatorPipe(Communication.Validation.WebhookEventSchema))
		event: RevenueCatWebhookPayload,
	): Promise<{ message: string }> {
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
						throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
							service: 'revenuecat',
							message: error instanceof Error ? error.message : 'Unknown error',
							eventId: event.event.transaction_id,
							userId: event.event.app_user_id,
						});
					}
					break;
				}

				default:
					throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
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
			throw AppError.internal(ErrorCodes.ERR_COMM_WEBHOOK_INVALID, {
				source: 'revenuecat',
				eventType: event.event.type,
				userId: event.event.app_user_id,
			});
		}
	}
}

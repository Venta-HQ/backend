import { firstValueFrom } from 'rxjs';
import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { RevenueCatWebhookACL, RevenueCatWebhookPayload } from '@venta/domains/communication/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SignedWebhookGuard } from '@venta/nest/guards';
import { GrpcInstance, Logger } from '@venta/nest/modules';
import {
	SubscriptionProvider,
	USER_MANAGEMENT_SERVICE_NAME,
	UserManagementServiceClient,
} from '@venta/proto/marketplace/user-management';

@Controller('revenuecat')
export class RevenueCatController {
	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME)
		private readonly client: GrpcInstance<UserManagementServiceClient>,
		private readonly logger: Logger,
	) {
		this.logger.setContext(RevenueCatController.name);
	}

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.REVENUECAT_WEBHOOK_SECRET || ''))
	async handleRevenueCatEvent(@Body() event: RevenueCatWebhookPayload): Promise<{ message: string }> {
		this.logger.debug(`Handling RevenueCat Webhook Event: ${event.event.type}`, {
			eventType: event.event.type,
			userId: event.event.app_user_id,
		});

		try {
			// Validate and transform webhook event
			const subscriptionEvent = RevenueCatWebhookACL.toSubscriptionEvent(event);

			switch (event.event.type) {
				case 'INITIAL_PURCHASE': {
					await firstValueFrom(
						this.client.invoke('handleSubscriptionCreated', {
							clerkUserId: subscriptionEvent.userId,
							provider: SubscriptionProvider.REVENUECAT,
							data: {
								eventId: subscriptionEvent.eventId,
								productId: subscriptionEvent.productId,
								transactionId: subscriptionEvent.transactionId,
							},
						} as any),
					);
					break;
				}

				default:
					throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
						field: 'event_type',
						message: 'Unsupported event type',
					});
			}

			return { message: 'Event processed successfully' };
		} catch (error) {
			const err = error as any;
			this.logger.error('Failed to handle RevenueCat webhook event', err instanceof Error ? err.stack : undefined, {
				error: err instanceof Error ? err.message : String(err),
				grpcCode: typeof err?.code === 'number' ? err.code : undefined,
				grpcDetails: err?.details,
				eventType: event.event.type,
				userId: event.event.app_user_id,
			});

			// Let the global exception filter map gRPC or other errors automatically
			throw error;
		}
	}
}

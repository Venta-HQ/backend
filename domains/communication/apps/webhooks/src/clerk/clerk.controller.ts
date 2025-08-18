import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClerkWebhookACL, ClerkWebhookPayload } from '@venta/domains/communication/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SignedWebhookGuard } from '@venta/nest/guards';
import { GrpcInstance, Logger } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

@Controller()
export class ClerkController {
	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME)
		private readonly client: GrpcInstance<UserManagementServiceClient>,
		private readonly logger: Logger,
	) {
		this.logger.setContext(ClerkController.name);
	}

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET || ''))
	async handleClerkEvent(@Body() event: ClerkWebhookPayload): Promise<{ message: string }> {
		this.logger.debug(`Handling Clerk Webhook Event: ${event.type}`, {
			eventType: event.type,
			userId: event.data?.id,
		});

		try {
			// Validate and transform webhook event
			const userEvent = ClerkWebhookACL.toUserEvent(event);

			switch (event.type) {
				case 'user.created': {
					await this.client.invoke('handleUserCreated', {
						id: userEvent.userId,
					});
					break;
				}

				case 'user.deleted': {
					await this.client.invoke('handleUserDeleted', {
						id: userEvent.userId,
					});
					break;
				}

				default:
					throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
						field: 'event_type',
						message: `Unsupported event type: ${event.type}`,
					});
			}

			return { message: 'Event processed successfully' };
		} catch (error) {
			this.logger.error('Failed to handle Clerk webhook event', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				eventType: event.type,
				eventId: event.data?.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_WEBHOOK_ERROR, {
				source: 'clerk',
				eventType: event.type,
				eventId: event.data?.id,
			});
		}
	}
}

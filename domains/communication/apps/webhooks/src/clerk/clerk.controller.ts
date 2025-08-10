import { Body, Controller, Inject, Logger, Post, UseGuards } from '@nestjs/common';
import { ClerkWebhookACL, ClerkWebhookPayload } from '@venta/domains/communication/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SignedWebhookGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

@Controller()
export class ClerkController {
	private readonly logger = new Logger(ClerkController.name);

	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME)
		private readonly client: GrpcInstance<UserManagementServiceClient>,
	) {}

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET || ''))
	async handleClerkEvent(@Body() event: ClerkWebhookPayload): Promise<{ message: string }> {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`, {
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
					throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
						field: 'event_type',
						message: `Unsupported event type: ${event.type}`,
						eventId: event.id,
					});
			}

			return { message: 'Event processed successfully' };
		} catch (error) {
			this.logger.error('Failed to handle Clerk webhook event', {
				error: error instanceof Error ? error.message : 'Unknown error',
				eventType: event.type,
				eventId: event.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_COMM_WEBHOOK_INVALID, {
				source: 'clerk',
				eventType: event.type,
				eventId: event.id,
			});
		}
	}
}

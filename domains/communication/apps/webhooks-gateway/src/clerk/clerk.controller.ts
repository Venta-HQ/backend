import { firstValueFrom } from 'rxjs';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClerkWebhookACL, ClerkWebhookPayload } from '@venta/domains/communication/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcInstance, Logger } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

@Controller('clerk')
export class ClerkController {
	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME)
		private readonly client: GrpcInstance<UserManagementServiceClient>,
		private readonly logger: Logger,
	) {
		this.logger.setContext(ClerkController.name);
	}

	@Post()
	// @UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET || ''))
	async handleClerkEvent(@Body() event: ClerkWebhookPayload): Promise<{ message: string }> {
		this.logger.debug(`Handling Clerk Webhook Event: ${event.type}`, {
			eventType: event.type,
			userId: event.data?.id,
		});

		this.logger.debug('event', event);
		try {
			// Validate and transform webhook event
			const userEvent = ClerkWebhookACL.toUserEvent(event);

			switch (event.type) {
				case 'user.created': {
					await firstValueFrom(
						this.client.invoke('handleUserCreated', {
							id: userEvent.userId,
						} as any),
					);
					break;
				}

				case 'user.deleted': {
					await firstValueFrom(
						this.client.invoke('handleUserDeleted', {
							id: userEvent.userId,
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
			this.logger.error('Failed to handle Clerk webhook event', err instanceof Error ? err.stack : undefined, {
				error: err instanceof Error ? err.message : String(err),
				grpcCode: typeof err?.code === 'number' ? err.code : undefined,
				grpcDetails: err?.details,
				eventType: event.type,
				eventId: event.data?.id,
			});

			// Let the global exception filter map gRPC or other errors automatically
			throw error;
		}
	}
}

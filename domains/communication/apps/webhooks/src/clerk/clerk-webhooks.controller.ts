import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';
import { Communication } from '../../../../contracts/types/context-mapping.types';

interface ClerkPayload {
	id: string;
}

@Controller()
export class ClerkWebhooksController {
	private readonly logger = new Logger(ClerkWebhooksController.name);

	constructor(@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>) {}

	@Post()
	async handleClerkEvent(@Body() event: Communication.WebhookEvent<ClerkPayload>): Promise<{ success: boolean }> {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`, {
			eventType: event.type,
			source: event.source,
			timestamp: event.timestamp,
		});

		try {
			switch (event.type) {
				case 'user.created': {
					const userEvent: Communication.UserEvent = {
						externalUserId: event.payload.id,
						service: 'clerk',
						type: 'created',
						timestamp: event.timestamp,
					};

					await this.client.invoke('handleUserCreated', {
						id: userEvent.externalUserId,
					});
					break;
				}

				case 'user.deleted': {
					const userEvent: Communication.UserEvent = {
						externalUserId: event.payload.id,
						service: 'clerk',
						type: 'deleted',
						timestamp: event.timestamp,
					};

					await this.client.invoke('handleUserDeleted', {
						id: userEvent.externalUserId,
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
			this.logger.error('Failed to handle Clerk webhook event', {
				error: error.message,
				eventType: event.type,
			});

			throw error; // Let the exception filter handle it
		}
	}
}

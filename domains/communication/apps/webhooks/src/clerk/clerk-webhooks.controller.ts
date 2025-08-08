import { AppError } from '@app/nest/errors';
import { SignedWebhookGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { Body, Controller, Headers, Inject, Logger, Post, UseGuards } from '@nestjs/common';
import { CommunicationToMarketplaceContextMapper } from '../../../../contracts/context-mappers/communication-to-marketplace-context-mapper';
import { Communication } from '../../../../contracts/types/context-mapping.types';
import { ClerkWebhookPayload } from '../../../../contracts/types/external/clerk.types';

@Controller()
export class ClerkWebhooksController {
	private readonly logger = new Logger(ClerkWebhooksController.name);

	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME)
		private readonly client: GrpcInstance<UserManagementServiceClient>,
		private readonly contextMapper: CommunicationToMarketplaceContextMapper,
	) {}

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET || ''))
	async handleClerkEvent(@Body() event: ClerkWebhookPayload): Promise<{ message: string }> {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`, {
			eventType: event.type,
			id: event.id,
		});

		try {
			switch (event.type) {
				case 'user.created': {
					const marketplaceEvent = this.contextMapper.toMarketplaceUserEvent({
						type: event.type,
						source: 'clerk',
						payload: event,
						timestamp: new Date(event.data.created_at).toISOString(),
					});

					await this.client.invoke('handleUserCreated', {
						id: marketplaceEvent.userId,
					});
					break;
				}

				case 'user.deleted': {
					const marketplaceEvent = this.contextMapper.toMarketplaceUserEvent({
						type: event.type,
						source: 'clerk',
						payload: event,
						timestamp: new Date(event.data.updated_at).toISOString(),
					});

					await this.client.invoke('handleUserDeleted', {
						id: marketplaceEvent.userId,
					});
					break;
				}

				default:
					this.logger.warn('Unhandled Event Type', {
						eventType: event.type,
						id: event.id,
					});
			}

			return { message: 'Event processed successfully' };
		} catch (error) {
			this.logger.error('Failed to handle Clerk webhook event', {
				error: error.message,
				eventType: event.type,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('WEBHOOK_PROCESSING_FAILED', 'Failed to process webhook');
		}
	}
}

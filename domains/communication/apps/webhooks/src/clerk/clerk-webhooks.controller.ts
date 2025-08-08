import { AppError, ErrorCodes } from '@app/nest/errors';
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
					try {
						const marketplaceEvent = this.contextMapper.toMarketplaceUserEvent({
							type: event.type,
							source: 'clerk',
							payload: event,
							timestamp: new Date(event.data.created_at).toISOString(),
						});

						await this.client.invoke('handleUserCreated', {
							id: marketplaceEvent.userId,
						});
					} catch (error) {
						throw AppError.externalService('USER_OPERATION_FAILED', ErrorCodes.USER_OPERATION_FAILED, {
							operation: 'handle_clerk_user_created',
							eventId: event.id,
							userId: event.data.id,
							error: error instanceof Error ? error.message : 'Unknown error',
						});
					}
					break;
				}

				case 'user.deleted': {
					try {
						const marketplaceEvent = this.contextMapper.toMarketplaceUserEvent({
							type: event.type,
							source: 'clerk',
							payload: event,
							timestamp: new Date(event.data.updated_at).toISOString(),
						});

						await this.client.invoke('handleUserDeleted', {
							id: marketplaceEvent.userId,
						});
					} catch (error) {
						throw AppError.externalService('USER_OPERATION_FAILED', ErrorCodes.USER_OPERATION_FAILED, {
							operation: 'handle_clerk_user_deleted',
							eventId: event.id,
							userId: event.data.id,
							error: error instanceof Error ? error.message : 'Unknown error',
						});
					}
					break;
				}

				default:
					throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
						operation: 'handle_clerk_event',
						eventType: event.type,
						eventId: event.id,
						message: 'Unhandled webhook event type',
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
			throw AppError.internal('USER_OPERATION_FAILED', ErrorCodes.USER_OPERATION_FAILED, {
				operation: 'handle_clerk_event',
				eventType: event.type,
				eventId: event.id,
			});
		}
	}
}

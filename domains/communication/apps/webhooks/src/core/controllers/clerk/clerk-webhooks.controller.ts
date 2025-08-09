import { AppError, ErrorCodes } from '@app/nest/errors';
import { SignedWebhookGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { CommunicationToMarketplaceContextMapper } from '@domains/communication/contracts/context-mappers/communication-to-marketplace.context-mapper';
import { Communication } from '@domains/communication/contracts/types/context-mapping.types';
import { ClerkWebhookPayload } from '@domains/communication/contracts/types/external/clerk.types';
import { Body, Controller, Headers, Inject, Logger, Post, UseGuards } from '@nestjs/common';

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
	async handleClerkEvent(
		@Body(new SchemaValidatorPipe(Communication.Validation.WebhookEventSchema))
		event: ClerkWebhookPayload,
	): Promise<{ message: string }> {
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
						throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
							service: 'clerk',
							message: error instanceof Error ? error.message : 'Unknown error',
							eventId: event.id,
							userId: event.data.id,
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
						throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
							service: 'clerk',
							message: error instanceof Error ? error.message : 'Unknown error',
							eventId: event.id,
							userId: event.data.id,
						});
					}
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

import { Request } from 'express';
import { SignedWebhookGuard } from '@app/auth';
import GrpcInstance from '@app/grpc';
import { Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';

@Controller()
export class ClerkWebhooksController {
	private readonly logger = new Logger(ClerkWebhooksController.name);

	constructor(@Inject(USER_SERVICE_NAME) private client: GrpcInstance<UserServiceClient>) {}

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET || ''))
	handleClerkEvent(@Body() event: UserWebhookEvent) {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`);
		switch (event.type) {
			case 'user.created':
				return this.client.invoke('handleClerkUserCreated', {
					id: event.data.id,
				});
			case 'user.deleted':
				return this.client.invoke('handleClerkUserDeleted', {
					id: event.data.id,
				});
			default:
				this.logger.warn('Unhandled Event Type');
		}
	}
}

import { SignedWebhookGuard } from '@app/auth';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';

@Controller()
export class ClerkWebhooksController {
	private readonly logger = new Logger(ClerkWebhooksController.name);

	@Post()
	@UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET || ''))
	handleClerkEvent(@Body() event: UserWebhookEvent) {
		this.logger.log(`Handling Clerk Webhook Event: ${(event as any).type}`);
		switch ((event as any).type) {
			case 'user.created':
				// Handle user creation
				break;
			case 'user.updated':
				// Handle user updates
				break;
			case 'user.deleted':
				// Handle user deletion
				break;
			default:
				this.logger.warn(`Unhandled Clerk event type: ${(event as any).type}`);
		}
	}
}

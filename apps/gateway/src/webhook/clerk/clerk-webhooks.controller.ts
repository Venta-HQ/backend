import { AUTH_SERVICE_NAME, AuthServiceClient } from '@app/proto/auth';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { Body, Controller, Inject, Logger, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class ClerkWebhooksController implements OnModuleInit {
	private readonly logger = new Logger(ClerkWebhooksController.name);
	private authService: AuthServiceClient;

	constructor(@Inject(AUTH_SERVICE_NAME) private client: ClientGrpc) {}

	onModuleInit() {
		this.authService = this.client.getService<AuthServiceClient>('AuthService');
	}

	@Post()
	handleClerkEvent(@Body() event: UserWebhookEvent) {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`);
		switch (event.type) {
			case 'user.created':
				return this.authService.handleClerkUserCreated({
					id: event.data.id,
				});
			case 'user.deleted':
				return this.authService.handleClerkUserDeleted({
					id: event.data.id,
				});
			default:
				this.logger.warn('Unhandled Event Type');
				throw new Error('Failure');
		}
	}
}

import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { Body, Controller, Inject, Logger, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class ClerkWebhooksController implements OnModuleInit {
	private readonly logger = new Logger(ClerkWebhooksController.name);
	private userService: UserServiceClient;

	constructor(@Inject(USER_SERVICE_NAME) private client: ClientGrpc) {}

	onModuleInit() {
		this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
	}

	@Post()
	handleClerkEvent(@Body() event: UserWebhookEvent) {
		this.logger.log(`Handling Clerk Webhook Event: ${event.type}`);
		switch (event.type) {
			case 'user.created':
				return this.userService.handleClerkUserCreated({
					id: event.data.id,
				});
			case 'user.deleted':
				return this.userService.handleClerkUserDeleted({
					id: event.data.id,
				});
			default:
				this.logger.warn('Unhandled Event Type');
				throw new Error('Failure');
		}
	}
}

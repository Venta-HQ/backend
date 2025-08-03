import { RevenueCatSubscriptionData, SubscriptionCreatedResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { IEventsService } from '@app/nest/modules';
import { Controller, Inject, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
	private readonly logger = new Logger(SubscriptionController.name);

	constructor(
		private readonly subscriptionService: SubscriptionService,
		@Inject('EventsService') private readonly eventsService: IEventsService,
	) {}

	@GrpcMethod(USER_SERVICE_NAME)
	async handleSubscriptionCreated(data: RevenueCatSubscriptionData): Promise<SubscriptionCreatedResponse> {
		// Create an Integration record
		await this.subscriptionService.createIntegration({
			clerkUserId: data.clerkUserId,
			data: data.data,
			providerId: data.providerId,
		});

		// Create a user subscription record
		await this.subscriptionService.createUserSubscription({
			clerkUserId: data.clerkUserId,
		});

		// Publish subscription created event
		await this.eventsService.publishEvent('subscription.created', {
			clerkUserId: data.clerkUserId,
			providerId: data.providerId,
			data: data.data,
			timestamp: new Date().toISOString(),
		});

		return { message: 'Success' };
	}
}

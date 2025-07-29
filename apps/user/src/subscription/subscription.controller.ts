import { RevenueCatSubscriptionData, SubscriptionCreatedResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
	constructor(private readonly subscriptionService: SubscriptionService) {}

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

		return { message: 'Success' };
	}
}

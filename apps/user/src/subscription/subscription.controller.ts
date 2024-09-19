import { RevenueCatSubscriptionData, SubscriptionCreatedResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
	private readonly logger = new Logger(SubscriptionController.name);

	constructor(private readonly subscriptionService: SubscriptionService) {}

	@GrpcMethod(USER_SERVICE_NAME)
	async handleSubscriptionCreated(data: RevenueCatSubscriptionData): Promise<SubscriptionCreatedResponse> {
		// Create an Integration record
		await this.subscriptionService.createIntegration({
			data: data.data,
			providerId: data.providerId,
			userId: data.userId,
		});

		// Create a user subscription record
		await this.subscriptionService.createUserSubscription({
			userId: data.userId,
		});

		return { message: 'Success' };
	}
}

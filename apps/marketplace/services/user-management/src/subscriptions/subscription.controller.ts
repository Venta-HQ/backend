import { GrpcRevenueCatSubscriptionDataSchema } from '@app/apitypes';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import {
	CreateSubscriptionData,
	CreateSubscriptionResponse,
	USER_MANAGEMENT_SERVICE_NAME,
} from '@app/proto/marketplace/user-management';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
	private readonly logger = new Logger(SubscriptionController.name);

	constructor(private readonly subscriptionService: SubscriptionService) {}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcRevenueCatSubscriptionDataSchema))
	async handleSubscriptionCreated(data: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
		this.logger.log(`Handling RevenueCat subscription created event`);

		// Create an Integration record
		await this.subscriptionService.createIntegration({
			clerkUserId: data.clerkUserId,
			data: data.data ? JSON.parse(JSON.stringify(data.data)) : undefined,
			providerId: data.providerId,
		});

		// Create a user subscription record
		await this.subscriptionService.createUserSubscription({
			clerkUserId: data.clerkUserId,
		});

		return { message: 'Success' };
	}
}

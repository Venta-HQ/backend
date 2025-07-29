import { GrpcSubscriptionCreateDataSchema } from '@app/apitypes/lib/subscription/subscription.types';
import { SubscriptionCreateData, SubscriptionCreateResponse, USER_SERVICE_NAME } from '@app/proto/user';
import { SchemaValidatorPipe } from '@app/validation';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
	private readonly logger = new Logger(SubscriptionController.name);

	constructor(private readonly subscriptionService: SubscriptionService) {}

	@GrpcMethod(USER_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcSubscriptionCreateDataSchema))
	async handleSubscriptionCreated(data: SubscriptionCreateData): Promise<SubscriptionCreateResponse> {
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

import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionCreateACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import {
	CreateSubscriptionData,
	CreateSubscriptionResponse,
	USER_MANAGEMENT_SERVICE_NAME,
} from '@venta/proto/marketplace/user-management';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
	private readonly logger = new Logger(SubscriptionController.name);

	constructor(private readonly subscriptionService: SubscriptionService) {}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async handleSubscriptionCreated(request: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
		// Transform and validate gRPC data to domain format
		const domainRequest = SubscriptionCreateACL.toDomain(request);

		this.logger.log(`Handling subscription created event`, {
			userId: domainRequest.userId,
			providerId: domainRequest.providerId,
		});

		try {
			// Create an Integration record
			await this.subscriptionService.createIntegration({
				clerkUserId: domainRequest.userId,
				data: domainRequest.data as any, // Convert to Prisma JSON format
				providerId: domainRequest.providerId,
			});

			// Create a user subscription record
			await this.subscriptionService.createUserSubscription({
				clerkUserId: domainRequest.userId,
			});

			this.logger.log('Subscription created successfully', {
				userId: domainRequest.userId,
				providerId: domainRequest.providerId,
			});

			return { message: 'Success' };
		} catch (error) {
			this.logger.error('Failed to create subscription', {
				error: error.message,
				userId: domainRequest.userId,
				providerId: domainRequest.providerId,
			});
			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_subscription',
				userId: domainRequest.userId,
			});
		}
	}
}

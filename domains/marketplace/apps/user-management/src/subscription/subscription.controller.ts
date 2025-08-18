import { Empty } from 'libs/proto/src/lib/shared/common';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionCreateACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';
import { CreateSubscriptionData, USER_MANAGEMENT_SERVICE_NAME } from '@venta/proto/marketplace/user-management';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
	constructor(
		private readonly subscriptionService: SubscriptionService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(SubscriptionController.name);
	}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async handleSubscriptionCreated(request: CreateSubscriptionData): Promise<Empty> {
		// Transform and validate gRPC data to domain format
		const domainRequest = SubscriptionCreateACL.toDomain(request);

		this.logger.debug(`Handling subscription created event`, {
			userId: domainRequest.userId,
			providerId: domainRequest.providerId,
		});

		try {
			// Create a user subscription record
			await this.subscriptionService.createUserSubscription({
				clerkUserId: domainRequest.userId,
			});

			this.logger.debug('Subscription created successfully', {
				userId: domainRequest.userId,
				providerId: domainRequest.providerId,
			});

			return { message: 'Success' } as unknown as Empty;
		} catch (error) {
			this.logger.error('Failed to create subscription', (error as Error).stack, {
				error: (error as Error).message,
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

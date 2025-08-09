import { AppError, ErrorCodes } from '@app/nest/errors';
import { SearchDiscovery } from '@domains/marketplace/contracts/types/search/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Anti-Corruption Layer for NATS integration
 */
@Injectable()
export class NatsACL {
	private readonly logger = new Logger(NatsACL.name);

	/**
	 * Validate subscription options
	 */
	validateSubscriptionOptions(options: unknown): options is SearchDiscovery.Core.SubscriptionOptions {
		try {
			const result = SearchDiscovery.Validation.SubscriptionOptionsSchema.safeParse(options);
			return result.success;
		} catch (error) {
			this.logger.error('Failed to validate subscription options', {
				error: error.message,
				options,
			});
			return false;
		}
	}

	/**
	 * Validate domain event
	 */
	validateDomainEvent<T = unknown>(event: unknown): event is SearchDiscovery.Core.DomainEvent<T> {
		try {
			const result = SearchDiscovery.Validation.DomainEventSchema.safeParse(event);
			return result.success;
		} catch (error) {
			this.logger.error('Failed to validate domain event', {
				error: error.message,
				event,
			});
			return false;
		}
	}

	/**
	 * Handle NATS error
	 */
	handleNatsError(error: unknown, context: { operation: string; subject?: string }): never {
		this.logger.error('NATS operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			operation: context.operation,
			subject: context.subject,
		});

		throw AppError.internal(ErrorCodes.ERR_NATS_OPERATION, context);
	}
}

import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { RealTime } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for NATS integration
 * Handles validation and transformation of NATS-specific data
 */
@Injectable()
export class NatsACL {
	private readonly logger = new Logger(NatsACL.name);

	/**
	 * Validate NATS message
	 */
	validateNatsMessage(data: unknown): data is RealTime.Core.Message {
		const result = RealTime.Validation.MessageSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation('INVALID_FORMAT', ErrorCodes.INVALID_FORMAT, {
				operation: 'validate_nats_message',
				errors: result.error.errors,
				field: 'message',
			});
		}
		return true;
	}

	/**
	 * Validate NATS subscription options
	 */
	validateNatsSubscriptionOptions(data: unknown): data is RealTime.Core.SubscriptionOptions {
		const result = RealTime.Validation.SubscriptionOptionsSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation('INVALID_SUBSCRIPTION_OPTIONS', ErrorCodes.INVALID_SUBSCRIPTION_OPTIONS, {
				operation: 'validate_nats_subscription_options',
				errors: result.error.errors,
				topic: (data as any)?.topic || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Convert NATS message to domain format
	 */
	toDomainMessage<T>(data: unknown): RealTime.Core.Message<T> {
		try {
			if (!this.validateNatsMessage(data)) {
				throw AppError.validation('INVALID_FORMAT', ErrorCodes.INVALID_FORMAT, {
					operation: 'to_domain_message',
					field: 'message',
				});
			}

			return {
				type: (data as RealTime.Core.Message).type,
				payload: (data as RealTime.Core.Message).payload as T,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to convert NATS message to domain format', { error });
			throw AppError.internal('NATS_OPERATION_FAILED', ErrorCodes.NATS_OPERATION_FAILED, {
				operation: 'to_domain_message',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Convert domain message to NATS format
	 */
	toNatsMessage<T>(message: RealTime.Core.Message<T>): RealTime.Core.Message<T> {
		try {
			return {
				type: message.type,
				payload: message.payload,
				timestamp: message.timestamp,
			};
		} catch (error) {
			this.logger.error('Failed to convert domain message to NATS format', { error });
			throw AppError.internal('NATS_OPERATION_FAILED', ErrorCodes.NATS_OPERATION_FAILED, {
				operation: 'to_nats_message',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Handle NATS error
	 */
	handleNatsError(error: Error, context: Record<string, unknown>): never {
		this.logger.error('NATS operation failed', {
			error: error.message,
			...context,
		});

		const operation = context.operation || 'nats_operation';

		if (error.message.includes('publish')) {
			throw AppError.internal('NATS_PUBLISH_FAILED', ErrorCodes.NATS_PUBLISH_FAILED, {
				operation,
				...context,
			});
		}

		if (error.message.includes('subscribe')) {
			throw AppError.internal('NATS_SUBSCRIBE_FAILED', ErrorCodes.NATS_SUBSCRIBE_FAILED, {
				operation,
				...context,
			});
		}

		throw AppError.internal('NATS_OPERATION_FAILED', ErrorCodes.NATS_OPERATION_FAILED, {
			operation,
			...context,
		});
	}
}

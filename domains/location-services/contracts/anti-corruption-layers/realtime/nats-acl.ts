import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { LocationServices } from '../../types/context-mapping.types';

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
	validateNatsMessage(data: unknown): data is LocationServices.RealTime.Core.Message {
		const result = LocationServices.RealTime.Validation.MessageSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
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
	validateNatsSubscriptionOptions(data: unknown): data is LocationServices.RealTime.Core.SubscriptionOptions {
		const result = LocationServices.RealTime.Validation.SubscriptionOptionsSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
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
	toDomainMessage<T>(data: unknown): LocationServices.RealTime.Core.Message<T> {
		try {
			if (!this.validateNatsMessage(data)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					operation: 'to_domain_message',
					field: 'message',
				});
			}

			return {
				type: (data as LocationServices.RealTime.Core.Message).type,
				payload: (data as LocationServices.RealTime.Core.Message).payload as T,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to convert NATS message to domain format', { error });
			throw AppError.internal(ErrorCodes.ERR_NATS_OPERATION, {
				operation: 'to_domain_message',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Convert domain message to NATS format
	 */
	toNatsMessage<T>(message: LocationServices.RealTime.Core.Message<T>): LocationServices.RealTime.Core.Message<T> {
		try {
			return {
				type: message.type,
				payload: message.payload,
				timestamp: message.timestamp,
			};
		} catch (error) {
			this.logger.error('Failed to convert domain message to NATS format', { error });
			throw AppError.internal(ErrorCodes.ERR_NATS_OPERATION, {
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
			throw AppError.internal(ErrorCodes.ERR_NATS_OPERATION, {
				operation,
				...context,
				type: 'publish',
			});
		}

		if (error.message.includes('subscribe')) {
			throw AppError.internal(ErrorCodes.ERR_NATS_OPERATION, {
				operation,
				...context,
				type: 'subscribe',
			});
		}

		throw AppError.internal(ErrorCodes.ERR_NATS_OPERATION, {
			operation,
			...context,
		});
	}
}

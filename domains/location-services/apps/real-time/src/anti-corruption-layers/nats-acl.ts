import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
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
	validateNatsMessage(data: unknown): data is RealTime.Contracts.NatsMessage {
		return RealTime.Validation.NatsMessageSchema.safeParse(data).success;
	}

	/**
	 * Validate NATS subscription options
	 */
	validateNatsSubscriptionOptions(data: unknown): data is RealTime.Contracts.NatsSubscriptionOptions {
		return RealTime.Validation.NatsSubscriptionOptionsSchema.safeParse(data).success;
	}

	/**
	 * Convert NATS message to domain format
	 */
	toDomainMessage<T>(data: unknown): RealTime.Core.Message<T> {
		try {
			if (!this.validateNatsMessage(data)) {
				throw AppError.validation('INVALID_INPUT', 'Invalid NATS message format');
			}

			return {
				type: data.type,
				payload: data.payload as T,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to convert NATS message to domain format', { error });
			throw AppError.internal('NATS_OPERATION_FAILED', 'Failed to convert NATS message', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Convert domain message to NATS format
	 */
	toNatsMessage<T>(message: RealTime.Core.Message<T>): RealTime.Contracts.NatsMessage {
		try {
			return {
				type: message.type,
				payload: message.payload,
				timestamp: message.timestamp,
			};
		} catch (error) {
			this.logger.error('Failed to convert domain message to NATS format', { error });
			throw AppError.internal('NATS_OPERATION_FAILED', 'Failed to convert domain message', {
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

		if (error.message.includes('publish')) {
			throw AppError.internal('NATS_PUBLISH_FAILED', 'Failed to publish NATS message', context);
		}

		if (error.message.includes('subscribe')) {
			throw AppError.internal('NATS_SUBSCRIBE_FAILED', 'Failed to subscribe to NATS topic', context);
		}

		throw AppError.internal('NATS_OPERATION_FAILED', 'NATS operation failed', context);
	}
}

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
	 * Validate message metadata
	 */
	validateMessageMetadata(data: unknown): data is RealTime.Core.MessageMetadata {
		return RealTime.Validation.MessageMetadataSchema.safeParse(data).success;
	}

	/**
	 * Validate message structure
	 */
	validateMessage(data: unknown): data is RealTime.Core.Message {
		return RealTime.Validation.MessageSchema.safeParse(data).success;
	}

	/**
	 * Validate subscription options
	 */
	validateSubscriptionOptions(data: unknown): data is RealTime.Core.SubscriptionOptions {
		return RealTime.Validation.SubscriptionOptionsSchema.safeParse(data).success;
	}

	/**
	 * Convert domain message to NATS format
	 */
	toNatsMessage<T>(message: RealTime.Core.Message<T>): { subject: string; data: Buffer } {
		try {
			const subject = message.metadata?.topic || 'default';
			const data = Buffer.from(JSON.stringify(message));

			return { subject, data };
		} catch (error) {
			this.logger.error('Failed to convert message to NATS format', { error });
			throw AppError.internal('NATS_PUBLISH_FAILED', ErrorCodes.NATS_PUBLISH_FAILED);
		}
	}

	/**
	 * Convert NATS message to domain format
	 */
	toDomainMessage<T>(subject: string, data: Buffer, info: Record<string, unknown>): RealTime.Core.Message<T> {
		try {
			const message = JSON.parse(data.toString());

			if (!this.validateMessage(message)) {
				throw new Error('Invalid message structure');
			}

			return {
				...message,
				metadata: {
					...message.metadata,
					topic: subject,
					attempts: info.attempts as number,
				},
			};
		} catch (error) {
			this.logger.error('Failed to convert NATS message to domain format', { error });
			throw AppError.internal('NATS_SUBSCRIBE_FAILED', ErrorCodes.NATS_SUBSCRIBE_FAILED);
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

		if (error.message.includes('timeout')) {
			throw AppError.internal('NATS_PUBLISH_FAILED', ErrorCodes.NATS_PUBLISH_FAILED, {
				reason: 'timeout',
				...context,
			});
		}

		if (error.message.includes('no responders')) {
			throw AppError.internal('NATS_SUBSCRIBE_FAILED', ErrorCodes.NATS_SUBSCRIBE_FAILED, {
				reason: 'no_subscribers',
				...context,
			});
		}

		throw AppError.internal('INTERNAL_SERVER_ERROR', ErrorCodes.INTERNAL_SERVER_ERROR, context);
	}
}

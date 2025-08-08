import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { RealTime } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for WebSocket integration
 * Handles validation and transformation of WebSocket-specific data
 */
@Injectable()
export class WebSocketACL {
	private readonly logger = new Logger(WebSocketACL.name);

	/**
	 * Validate location update message
	 */
	validateLocationUpdate(data: unknown): data is RealTime.Contracts.LocationUpdate {
		return RealTime.Validation.LocationUpdateSchema.safeParse(data).success;
	}

	/**
	 * Validate vendor status message
	 */
	validateVendorStatus(data: unknown): data is RealTime.Contracts.VendorStatus {
		return RealTime.Validation.VendorStatusSchema.safeParse(data).success;
	}

	/**
	 * Validate subscription request
	 */
	validateSubscriptionRequest(data: unknown): data is RealTime.Contracts.SubscriptionRequest {
		return RealTime.Validation.SubscriptionRequestSchema.safeParse(data).success;
	}

	/**
	 * Convert client data to domain connection
	 */
	toDomainConnection(
		clientId: string,
		userId: string,
		metadata: Record<string, unknown>,
	): RealTime.Core.ClientConnection {
		return {
			id: clientId,
			userId,
			connectedAt: new Date().toISOString(),
			subscriptions: [],
			metadata: this.sanitizeMetadata(metadata),
		};
	}

	/**
	 * Convert WebSocket message to domain format
	 */
	toDomainMessage<T>(type: string, data: unknown): RealTime.Core.Message<T> {
		try {
			return {
				type,
				payload: data as T,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to convert WebSocket message to domain format', { error });
			throw AppError.validation('INVALID_INPUT', 'Invalid WebSocket message format');
		}
	}

	/**
	 * Handle WebSocket error
	 */
	handleWebSocketError(error: Error, context: Record<string, unknown>): never {
		this.logger.error('WebSocket operation failed', {
			error: error.message,
			...context,
		});

		if (error.message.includes('rate limit')) {
			throw AppError.validation('WS_RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', context);
		}

		if (error.message.includes('unauthorized')) {
			throw AppError.unauthorized('VENDOR_UNAUTHORIZED', 'Unauthorized operation', context);
		}

		throw AppError.internal('NATS_OPERATION_FAILED', 'Operation failed', context);
	}

	/**
	 * Sanitize client metadata
	 */
	private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, string> {
		const sanitized: Record<string, string> = {};

		for (const [key, value] of Object.entries(metadata)) {
			if (typeof value === 'string') {
				sanitized[key] = value;
			} else {
				sanitized[key] = JSON.stringify(value);
			}
		}

		return sanitized;
	}
}

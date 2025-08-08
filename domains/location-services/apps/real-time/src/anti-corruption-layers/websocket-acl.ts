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
		const result = RealTime.Validation.LocationUpdateSchema.safeParse(data);
		if (!result.success) {
			this.logger.error('Invalid location update data', {
				errors: result.error.errors,
			});
			throw AppError.validation('LOCATION_INVALID_COORDINATES', ErrorCodes.LOCATION_INVALID_COORDINATES, {
				errors: result.error.errors,
			});
		}
		return true;
	}

	/**
	 * Validate vendor status message
	 */
	validateVendorStatus(data: unknown): data is RealTime.Contracts.VendorStatus {
		const result = RealTime.Validation.VendorStatusSchema.safeParse(data);
		if (!result.success) {
			this.logger.error('Invalid vendor status data', {
				errors: result.error.errors,
			});
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				errors: result.error.errors,
				message: 'Invalid vendor status data',
			});
		}
		return true;
	}

	/**
	 * Validate subscription request
	 */
	validateSubscriptionRequest(data: unknown): data is RealTime.Contracts.SubscriptionRequest {
		const result = RealTime.Validation.SubscriptionRequestSchema.safeParse(data);
		if (!result.success) {
			this.logger.error('Invalid subscription request data', {
				errors: result.error.errors,
			});
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				errors: result.error.errors,
				message: 'Invalid subscription request data',
			});
		}
		return true;
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
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				type,
				error: error instanceof Error ? error.message : 'Unknown error',
				message: 'Invalid WebSocket message format',
			});
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
			throw AppError.validation('WS_RATE_LIMIT_EXCEEDED', ErrorCodes.WS_RATE_LIMIT_EXCEEDED, context);
		}

		if (error.message.includes('unauthorized')) {
			throw AppError.unauthorized('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				...context,
				message: 'Unauthorized WebSocket operation',
			});
		}

		throw AppError.internal('DATABASE_ERROR', ErrorCodes.DATABASE_ERROR, {
			...context,
			operation: 'WebSocket connection',
		});
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

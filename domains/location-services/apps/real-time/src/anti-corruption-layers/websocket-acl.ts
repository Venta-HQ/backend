import { AppError, ErrorCodes } from '@app/nest/errors';
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
			throw AppError.validation('LOCATION_INVALID_COORDINATES', ErrorCodes.LOCATION_INVALID_COORDINATES, {
				operation: 'validate_location_update',
				errors: result.error.errors,
				entityId: (data as any)?.entityId || 'undefined',
				message: 'Invalid location coordinates',
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
			throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
				operation: 'validate_vendor_status',
				errors: result.error.errors,
				vendorId: (data as any)?.vendorId || 'undefined',
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
			throw AppError.validation('INVALID_SUBSCRIPTION_OPTIONS', ErrorCodes.INVALID_SUBSCRIPTION_OPTIONS, {
				operation: 'validate_subscription_request',
				errors: result.error.errors,
				topic: (data as any)?.topic || 'undefined',
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
		if (!clientId || !userId) {
			throw AppError.validation('MISSING_REQUIRED_FIELD', ErrorCodes.MISSING_REQUIRED_FIELD, {
				operation: 'to_domain_connection',
				field: !clientId ? 'clientId' : 'userId',
				message: 'Missing required fields for connection',
			});
		}

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
		if (!type) {
			throw AppError.validation('WS_INVALID_MESSAGE_FORMAT', ErrorCodes.WS_INVALID_MESSAGE_FORMAT, {
				operation: 'to_domain_message',
				type: type || 'undefined',
				message: 'Missing message type',
			});
		}

		try {
			return {
				type,
				payload: data as T,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			throw AppError.validation('WS_INVALID_MESSAGE_FORMAT', ErrorCodes.WS_INVALID_MESSAGE_FORMAT, {
				operation: 'to_domain_message',
				type,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Handle WebSocket error
	 */
	handleWebSocketError(error: Error, context: Record<string, unknown>): never {
		this.logger.error('WebSocket operation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			...context,
		});

		const operation = context.operation || 'websocket_operation';

		if (error.message.includes('rate limit')) {
			throw AppError.validation('WS_RATE_LIMIT_EXCEEDED', ErrorCodes.WS_RATE_LIMIT_EXCEEDED, {
				operation,
				...context,
			});
		}

		if (error.message.includes('unauthorized')) {
			throw AppError.unauthorized('WS_AUTHENTICATION_FAILED', ErrorCodes.WS_AUTHENTICATION_FAILED, {
				operation,
				...context,
			});
		}

		if (error.message.includes('connection')) {
			throw AppError.internal('WS_CONNECTION_FAILED', ErrorCodes.WS_CONNECTION_FAILED, {
				operation,
				...context,
			});
		}

		throw AppError.internal('WS_INVALID_MESSAGE_FORMAT', ErrorCodes.WS_INVALID_MESSAGE_FORMAT, {
			operation,
			...context,
		});
	}

	/**
	 * Sanitize client metadata
	 */
	private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, string> {
		if (!metadata || typeof metadata !== 'object') {
			throw AppError.validation('INVALID_FORMAT', ErrorCodes.INVALID_FORMAT, {
				operation: 'sanitize_metadata',
				field: 'metadata',
				message: 'Invalid metadata format',
			});
		}

		const sanitized: Record<string, string> = {};

		for (const [key, value] of Object.entries(metadata)) {
			if (typeof value === 'string') {
				sanitized[key] = value;
			} else {
				try {
					sanitized[key] = JSON.stringify(value);
				} catch (error) {
					throw AppError.validation('INVALID_FORMAT', ErrorCodes.INVALID_FORMAT, {
						operation: 'sanitize_metadata',
						field: key,
						message: 'Failed to stringify metadata value',
					});
				}
			}
		}

		return sanitized;
	}
}

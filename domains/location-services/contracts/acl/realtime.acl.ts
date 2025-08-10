import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * Realtime Services ACL
 * Handles validation and transformation for real-time communication
 */

// Domain types
export interface RealtimeMessage {
	type: string;
	payload: Record<string, any>;
	timestamp: string;
	userId?: string;
	sessionId?: string;
}

export interface WebSocketConnection {
	userId: string;
	sessionId: string;
	connectionId: string;
	connectedAt: string;
}

export interface NatsSubscriptionOptions {
	subject: string;
	queue?: string;
	durableName?: string;
	maxMessages?: number;
}

/**
 * Realtime Message ACL
 * Validates and transforms real-time messages
 */
export class RealtimeMessageACL {
	// WebSocket → Domain (inbound)
	static validate(data: any): void {
		if (!data.type?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'type',
				message: 'Message type is required',
			});
		}
		if (!data.payload || typeof data.payload !== 'object') {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'payload',
				message: 'Message payload is required and must be an object',
			});
		}
	}

	static toDomain(data: any): RealtimeMessage {
		this.validate(data);

		return {
			type: data.type,
			payload: data.payload,
			timestamp: data.timestamp || new Date().toISOString(),
			userId: data.userId,
			sessionId: data.sessionId,
		};
	}

	// Domain → WebSocket (outbound)
	static toWebSocket(domain: RealtimeMessage): {
		type: string;
		payload: Record<string, any>;
		timestamp: string;
	} {
		return {
			type: domain.type,
			payload: domain.payload,
			timestamp: domain.timestamp,
		};
	}
}

/**
 * NATS Subscription ACL
 * Validates and transforms NATS subscription options
 */
export class NatsSubscriptionACL {
	// Config → Domain (inbound)
	static validate(options: any): void {
		if (!options.subject?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'subject',
				message: 'NATS subject is required',
			});
		}
	}

	static toDomain(options: any): NatsSubscriptionOptions {
		this.validate(options);

		return {
			subject: options.subject,
			queue: options.queue,
			durableName: options.durableName,
			maxMessages: options.maxMessages,
		};
	}
}

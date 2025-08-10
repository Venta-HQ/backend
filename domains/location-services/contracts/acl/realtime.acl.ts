// Validation utilities
import { validateMessagePayload, validateRequiredString } from '../schemas/validation.utils';

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
		validateRequiredString(data.type, 'type');
		validateMessagePayload(data.payload, 'payload');
	}

	static toDomain(data: any): RealtimeMessage {
		this.validate(data);

		return {
			type: validateRequiredString(data.type, 'type'),
			payload: validateMessagePayload(data.payload, 'payload'),
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
		validateRequiredString(options.subject, 'subject');
	}

	static toDomain(options: any): NatsSubscriptionOptions {
		this.validate(options);

		return {
			subject: validateRequiredString(options.subject, 'subject'),
			queue: options.queue,
			durableName: options.durableName,
			maxMessages: options.maxMessages,
		};
	}
}

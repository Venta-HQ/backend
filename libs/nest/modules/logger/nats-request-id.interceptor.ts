import { ExecutionContext, Injectable } from '@nestjs/common';
import { RequestContextService } from '../request-context';
import { BaseRequestIdInterceptor, RequestIdExtractor } from './base-request-id.interceptor';

/**
 * NATS-specific correlation ID extractor
 */
class NatsCorrelationIdExtractor implements RequestIdExtractor {
	extractId(context: ExecutionContext): string | undefined {
		const natsContext = context.switchToRpc();
		const message = natsContext.getData();
		return this.extractCorrelationId(message);
	}

	getProtocolName(): string {
		return 'NATS correlation';
	}

	private extractCorrelationId(message: any): string | undefined {
		if (!message || typeof message !== 'object') {
			return undefined;
		}

		// Check if message has a correlationId field (BaseEvent format)
		if ('correlationId' in message && message.correlationId) {
			return message.correlationId;
		}

		// Check if message has a data field with correlationId (wrapped format)
		if ('data' in message && message.data && typeof message.data === 'object') {
			if ('correlationId' in message.data && message.data.correlationId) {
				return message.data.correlationId;
			}
		}

		// Check if message is an array and first element has correlationId
		if (Array.isArray(message) && message.length > 0) {
			const firstMessage = message[0];
			if (firstMessage && typeof firstMessage === 'object' && 'correlationId' in firstMessage) {
				return firstMessage.correlationId;
			}
		}

		return undefined;
	}
}

/**
 * Interceptor for NATS message handlers that automatically extracts correlation IDs
 * from message data and sets them in the request context for logging and tracing.
 */
@Injectable()
export class NatsRequestIdInterceptor extends BaseRequestIdInterceptor {
	constructor(requestContextService: RequestContextService) {
		super(requestContextService, new NatsCorrelationIdExtractor());
	}

	/**
	 * Override to set correlation ID instead of request ID for NATS
	 */
	protected setId(id: string): void {
		this.requestContextService.setCorrelationId(id);
	}
}

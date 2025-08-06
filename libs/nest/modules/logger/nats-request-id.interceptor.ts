import { CallHandler, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestContextService } from '../request-context';

interface BaseEvent {
	correlationId?: string;
	eventId: string;
	data: any;
	source: string;
	timestamp: string;
	version: string;
}

/**
 * Interceptor for NATS message handlers that automatically extracts correlation IDs
 * from message data and sets them in the request context for logging and tracing.
 *
 * This follows the same pattern as gRPC interceptors for consistency.
 */
@Injectable()
export class NatsRequestIdInterceptor {
	private readonly logger = new Logger(NatsRequestIdInterceptor.name);

	constructor(private readonly requestContextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		try {
			// Extract message data from NATS context
			const natsContext = context.switchToRpc();
			const message = natsContext.getData();

			// Extract correlation ID from message
			const correlationId = this.extractCorrelationId(message);

			if (correlationId) {
				this.requestContextService.setCorrelationId(correlationId);
				this.logger.debug(`Extracted NATS correlation ID: ${correlationId}`);
			} else {
				this.logger.debug('No correlation ID found in NATS message');
			}

			// Process the message and clear context when done
			return next.handle().pipe(
				tap({
					error: (_error) => {
						this.logger.debug('Clearing request context after NATS error');
						this.requestContextService.clear();
					},
					next: () => {
						this.logger.debug('Clearing request context after NATS success');
						this.requestContextService.clear();
					},
				}),
			);
		} catch (error) {
			this.logger.error('Error in NATS request ID interceptor', error);
			// Ensure context is cleared even if interceptor fails
			this.requestContextService.clear();
			return next.handle();
		}
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
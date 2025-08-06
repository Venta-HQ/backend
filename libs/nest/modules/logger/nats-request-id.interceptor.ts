import { CallHandler, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestContextService } from '../request-context';

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
		// Extract message data from NATS context
		const natsContext = context.switchToRpc();
		const message = natsContext.getData();

		// Try to extract correlation ID from different possible locations
		let correlationId: string | undefined;

		// Check if message has a correlationId field (BaseEvent format)
		if (message && typeof message === 'object' && 'correlationId' in message) {
			correlationId = message.correlationId;
		}

		// Check if message has a data field with correlationId (wrapped format)
		if (!correlationId && message && typeof message === 'object' && 'data' in message) {
			const data = message.data;
			if (data && typeof data === 'object' && 'correlationId' in data) {
				correlationId = data.correlationId;
			}
		}

		// Check if message is an array and first element has correlationId
		if (!correlationId && Array.isArray(message) && message.length > 0) {
			const firstMessage = message[0];
			if (firstMessage && typeof firstMessage === 'object' && 'correlationId' in firstMessage) {
				correlationId = firstMessage.correlationId;
			}
		}

		// Set correlation ID in request context if found
		if (correlationId) {
			this.requestContextService.set('correlationId', correlationId);
			this.logger.debug(`Set correlation ID in request context: ${correlationId}`);
		} else {
			this.logger.debug('No correlation ID found in NATS message');
		}

		// Process the message and clear context when done
		return next.handle().pipe(
			tap({
				next: () => {
					this.requestContextService.clear();
				},
				error: () => {
					this.requestContextService.clear();
				},
			}),
		);
	}
} 
import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { NatsRequestIdInterceptor } from './nats-request-id.interceptor';

/**
 * Base class for NATS consumers that automatically includes request ID interceptor.
 * 
 * This ensures that all NATS consumers automatically extract correlation IDs
 * from messages and make them available to the logger service.
 * 
 * Usage:
 * ```typescript
 * @Injectable()
 * @UseInterceptors(NatsRequestIdInterceptor)
 * export class YourNatsConsumer extends NatsConsumerBase {
 *   // Your consumer implementation
 * }
 * ```
 */
@Injectable()
@UseInterceptors(NatsRequestIdInterceptor)
export abstract class NatsConsumerBase {
	protected readonly logger = new Logger(this.constructor.name);

	/**
	 * Handle a NATS message with automatic correlation ID extraction.
	 * The correlation ID will be automatically available in all log messages.
	 */
	protected abstract handleMessage(data: any): Promise<void>;
} 
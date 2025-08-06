import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from '../../networking/request-context';

export interface RequestIdExtractor {
	extractId(context: ExecutionContext): string | undefined;
	getProtocolName(): string;
}

/**
 * Base interceptor for request ID extraction that can be extended by protocol-specific interceptors.
 * This reduces code duplication and ensures consistent behavior across all protocols.
 */
@Injectable()
export abstract class BaseRequestIdInterceptor {
	protected readonly logger = new Logger(this.constructor.name);

	constructor(
		protected readonly requestContextService: RequestContextService,
		protected readonly extractor: RequestIdExtractor,
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		try {
			// Extract request/correlation ID using the provided extractor
			const id = this.extractor.extractId(context);

			if (id) {
				this.setId(id);
				this.logger.debug(`Extracted ${this.extractor.getProtocolName()} ID: ${id}`);
			} else {
				this.logger.debug(`No ${this.extractor.getProtocolName()} ID found`);
			}

			// Process the request and clear context when done
			return next.handle().pipe(
				tap({
					error: (_error) => {
						this.logger.debug(`Clearing request context after ${this.extractor.getProtocolName()} error`);
						this.requestContextService.clear();
					},
					next: () => {
						this.logger.debug(`Clearing request context after ${this.extractor.getProtocolName()} success`);
						this.requestContextService.clear();
					},
				}),
			);
		} catch (error) {
			this.logger.error(`Error in ${this.extractor.getProtocolName()} request ID interceptor`, error);
			// Ensure context is cleared even if interceptor fails
			this.requestContextService.clear();
			return next.handle();
		}
	}

	/**
	 * Set the extracted ID in the appropriate context field
	 * Override in subclasses to handle protocol-specific ID types
	 */
	protected setId(id: string): void {
		this.requestContextService.setRequestId(id);
	}
}

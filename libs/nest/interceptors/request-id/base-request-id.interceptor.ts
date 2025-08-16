import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable } from '@nestjs/common';
import { Logger } from '@venta/nest/modules';
import { RequestContextService } from '../../modules/networking/request-context';

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
	constructor(
		protected readonly requestContextService: RequestContextService,
		protected readonly extractor: RequestIdExtractor,
		protected readonly logger: Logger,
	) {
		this.logger.setContext(this.constructor.name);
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		// Check if we already have an ALS context (e.g., from AuthGuard)
		const hasExistingContext = this.requestContextService.getRequestId() !== undefined;

		if (hasExistingContext) {
			// If context already exists, just handle the request without creating a new context
			return this.handleRequest(context, next);
		} else {
			// Create new ALS context if none exists
			return new Observable((observer) => {
				this.requestContextService.run(() => {
					const result$ = this.handleRequest(context, next);
					result$.subscribe({
						next: (value) => observer.next(value),
						error: (error) => observer.error(error),
						complete: () => observer.complete(),
					});
				});
			});
		}
	}

	private handleRequest(context: ExecutionContext, next: CallHandler): Observable<any> {
		try {
			// Extract request/correlation ID using the provided extractor
			const id = this.extractor.extractId(context);

			if (id) {
				// Only set if not already set
				if (!this.requestContextService.getRequestId()) {
					this.setId(id);
				}
			}

			// Process the request
			return next.handle().pipe(
				tap({
					next: () => {
						this.logger.debug(`Request completed successfully for ${this.extractor.getProtocolName()}`);
					},
					error: (e) => {
						this.logger.error(`Request failed for ${this.extractor.getProtocolName()}`, e.stack, {
							error: e,
						});
					},
				}),
			);
		} catch (error) {
			this.logger.error(`Error in ${this.extractor.getProtocolName()} request ID interceptor`, error.stack, {
				error,
			});
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

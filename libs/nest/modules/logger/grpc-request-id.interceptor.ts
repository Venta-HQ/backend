import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from '../request-context';

/**
 * Interceptor for gRPC request handlers that automatically extracts request IDs
 * from gRPC metadata and sets them in the request context for logging and tracing.
 *
 * This follows the same pattern as HTTP and NATS interceptors for consistency.
 */
@Injectable()
export class GrpcRequestIdInterceptor {
	private readonly logger = new Logger(GrpcRequestIdInterceptor.name);

	constructor(private readonly requestContextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		try {
			// Extract metadata from gRPC context
			const grpcContext = context.switchToRpc();
			const metadata = grpcContext.getContext();

			// Extract request ID from metadata
			const requestId = metadata?.get('requestId')?.[0];

			if (requestId) {
				this.requestContextService.setRequestId(requestId);
				this.logger.debug(`Extracted gRPC request ID: ${requestId}`);
			} else {
				this.logger.debug('No request ID found in gRPC metadata');
			}

			// Process the request and clear context when done
			return next.handle().pipe(
				tap({
					error: (_error) => {
						this.logger.debug('Clearing request context after gRPC error');
						this.requestContextService.clear();
					},
					next: () => {
						this.logger.debug('Clearing request context after gRPC success');
						this.requestContextService.clear();
					},
				}),
			);
		} catch (error) {
			this.logger.error('Error in gRPC request ID interceptor', error);
			// Ensure context is cleared even if interceptor fails
			this.requestContextService.clear();
			return next.handle();
		}
	}
}

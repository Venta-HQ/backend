import { CallHandler, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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
		// Extract metadata from gRPC context
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		// Extract request ID from metadata
		const requestId = metadata?.get('requestId')?.[0];
		
		if (requestId) {
			this.requestContextService.set('requestId', requestId);
			this.logger.log(`Received gRPC request with ID: ${requestId}`);
		} else {
			this.logger.debug('Received gRPC request without request ID');
		}

		// Process the request and clear context when done
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
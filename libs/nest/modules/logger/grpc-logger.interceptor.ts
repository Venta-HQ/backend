import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { RequestContextService } from '../request-context';

@Injectable()
export class GrpcRequestIdInterceptor implements NestInterceptor {
	constructor(private readonly requestContextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		// Extract request ID from metadata if available
		const requestId = metadata?.get('requestId')?.[0];
		if (requestId) {
			this.requestContextService.set('requestId', requestId);
		}

		return next.handle().pipe(
			tap(() => {
				// Safely clear the context after the request is complete
				try {
					if (this.requestContextService && typeof this.requestContextService.clear === 'function') {
						this.requestContextService.clear();
					}
				} catch (error) {
					// Silently handle any errors during context clearing
					// This prevents gRPC errors from being thrown
				}
			}),
		);
	}
}

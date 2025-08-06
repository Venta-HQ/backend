import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Optional } from '@nestjs/common';
import { RequestContextService } from '../request-context';

@Injectable()
export class GrpcRequestIdInterceptor implements NestInterceptor {
	constructor(@Optional() private readonly requestContextService?: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		// Only proceed if RequestContextService is available
		if (!this.requestContextService) {
			return next.handle();
		}

		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		// Extract request ID from metadata if available
		const requestId = metadata?.get('requestId')?.[0];
		if (requestId) {
			this.requestContextService.set('requestId', requestId);
		}

		return next.handle().pipe(
			tap(() => {
				// Clear the context after the request is complete
				// RequestContextService is request-scoped, so it will be automatically cleaned up
				// We don't need to manually clear it
			}),
		);
	}
}

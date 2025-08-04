import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestContextService } from './request-context.service';

@Injectable()
export class GrpcRequestIdInterceptor implements NestInterceptor {
	constructor(private readonly requestContextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const grpcContext = context.switchToRpc();
		const data = grpcContext.getData();
		const metadata = grpcContext.getContext();

		// Extract request ID from metadata if available
		const requestId = metadata?.get('requestId')?.[0];
		if (requestId) {
			this.requestContextService.set('requestId', requestId);
		}

		return next.handle().pipe(
			tap(() => {
				// Clear the context after the request is complete
				this.requestContextService.clear();
			}),
		);
	}
} 
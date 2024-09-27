import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { GrpcLogger } from './grpc-logger.service';

@Injectable()
export class GrpcRequestIdInterceptor implements NestInterceptor {
	constructor(private readonly grpcLoggerService: GrpcLogger) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		// Extract or generate the requestId
		const requestId = metadata.get('requestid');
		// Create a child logger with requestId for this specific request
		this.grpcLoggerService.setRequestId(requestId[0] ?? 'no-request-id');

		return next.handle().pipe(
			tap(() => {
				// DO NOT REMOVE, this prevents request IDs from bleeding to subsequent requests
				this.grpcLoggerService.clearRequest();
			}),
		);
	}
}

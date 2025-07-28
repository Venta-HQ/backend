import { Observable } from 'rxjs';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RequestContextService } from './request-context.service';

@Injectable()
export class GrpcRequestIdInterceptor implements NestInterceptor {
	constructor(private readonly requestContextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		// Extract or generate the requestId
		const requestId = metadata.get('requestid');

		return new Observable((observer) => {
			this.requestContextService.run(() => {
				// Set the requestId in the AsyncLocalStorage
				const requestIdValue = requestId && requestId.length > 0 ? requestId[0] : 'no-request-id';
				this.requestContextService.set('requestId', requestIdValue);

				next.handle().subscribe({
					complete: () => {
						observer.complete(); // Complete the observable stream
					},
					error: (err) => {
						observer.error(new RpcException(err)); // Handle error properly
					},
					next: (value) => {
						observer.next(value); // Propagate the response
					},
				});
			});
		});
	}
}

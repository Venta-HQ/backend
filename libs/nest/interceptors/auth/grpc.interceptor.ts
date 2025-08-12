import { Observable } from 'rxjs';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AuthUser } from '@venta/nest/guards';

@Injectable()
export class GrpcAuthInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const rpcHost = context.switchToRpc();
		const metadata = rpcHost.getContext().metadata;

		const userId = metadata.get('x-user-id');
		const clerkId = metadata.get('x-clerk-id');

		if (!userId || !clerkId) {
			throw AppError.unauthorized(ErrorCodes.ERR_INSUFFICIENT_PERMISSIONS, {
				resource: 'grpc_auth',
			});
		}

		metadata.set('user', {
			id: userId,
			clerkId: clerkId,
		} as AuthUser);

		return next.handle();
	}
}

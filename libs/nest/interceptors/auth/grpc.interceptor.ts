import { Observable } from 'rxjs';
import { CallHandler, createParamDecorator, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AuthenticatedGrpcContext } from '@venta/nest/guards';

@Injectable()
export class GrpcAuthInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const rpcHost = context.switchToRpc();
		const call = rpcHost.getContext(); // ServerUnaryCall
		const metadata = call.metadata;

		const userId = metadata.get('x-user-id');
		const clerkId = metadata.get('x-clerk-id');

		if (!userId || !clerkId) {
			throw AppError.unauthorized(ErrorCodes.ERR_INSUFFICIENT_PERMISSIONS, {
				resource: 'grpc_auth',
			});
		}

		// Attach user data to the call object
		(call as any).user = {
			id: Array.isArray(userId) ? userId[0] : userId,
			clerkId: Array.isArray(clerkId) ? clerkId[0] : clerkId,
		};

		return next.handle();
	}
}

export const GrpcRequestContext = createParamDecorator((data, ctx: ExecutionContext) => {
	const rpcHost = ctx.switchToRpc();
	const call = rpcHost.getContext() as AuthenticatedGrpcContext;
	return call;
});

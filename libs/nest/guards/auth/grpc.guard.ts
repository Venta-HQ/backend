import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
	private readonly logger = new Logger(GrpcAuthGuard.name);

	constructor() {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		const userId = metadata?.get('x-user-id')?.[0];
		const clerkId = metadata?.get('x-clerk-id')?.[0];

		console.log('userId', userId);
		console.log('clerkId', clerkId);

		if (!userId || !clerkId) {
			throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
		}

		return true;
	}
}

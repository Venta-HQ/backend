import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
	private readonly logger = new Logger(GrpcAuthGuard.name);

	constructor() {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		// Check if user was set by the interceptor
		const userId = metadata.get('x-user-id');
		const clerkId = metadata.get('x-clerk-id');

		if (!userId || !clerkId) {
			this.logger.error('GrpcAuthGuard - Authentication required but no user found:', {
				hasMetadata: !!metadata,
				userIdExists: !!userId,
				clerkIdExists: !!clerkId,
			});

			throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
				resource: 'grpc_endpoint',
				reason: 'Authentication required - missing or invalid auth headers',
			});
		}

		return true;
	}
}

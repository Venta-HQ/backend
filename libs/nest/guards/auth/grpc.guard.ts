import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { extractGrpcRequestMetadata } from '@venta/utils';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
	private readonly logger = new Logger(GrpcAuthGuard.name);

	constructor() {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		const metadataExtracted = extractGrpcRequestMetadata(metadata);

		this.logger.debug('Metadata', metadataExtracted);

		if (!metadataExtracted?.user?.id || !metadataExtracted?.user?.clerkId) {
			this.logger.error('GrpcAuthGuard - Authentication required but no user found', {
				userIdExists: !!metadataExtracted?.user?.id,
				clerkIdExists: !!metadataExtracted?.user?.clerkId,
			});

			throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
				resource: 'grpc_endpoint',
				reason: 'Authentication required - missing or invalid auth headers',
			});
		}

		return true;
	}
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { extractGrpcRequestMetadata } from '@venta/utils';
import { Logger } from '../../modules/core/logger/logger.service';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
	constructor(private readonly logger: Logger) {
		this.logger.setContext(GrpcAuthGuard.name);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		const metadataExtracted = extractGrpcRequestMetadata(metadata);

		if (!metadataExtracted?.user?.id || !metadataExtracted?.user?.clerkId) {
			throw AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
				resource: 'grpc_endpoint',
				reason: 'Authentication required - missing or invalid auth headers',
			});
		}

		return true;
	}
}

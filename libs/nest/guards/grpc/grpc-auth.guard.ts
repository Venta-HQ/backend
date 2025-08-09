import { AppError, ErrorCodes } from '@app/nest/errors';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuthService } from '../core/auth.service';
import { AuthProtocol } from '../types';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
	private readonly logger = new Logger(GrpcAuthGuard.name);

	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const metadata = context.getArgByIndex(1); // gRPC metadata is the second argument
		const token = this.authService.extractGrpcToken(metadata);

		if (!token) {
			this.logger.debug('No token found in gRPC metadata');
			throw new RpcException(AppError.unauthorized(ErrorCodes.ERR_INVALID_TOKEN));
		}

		try {
			// Validate token and get user
			const user = await this.authService.validateToken(token);

			// Create auth context
			const authContext = this.authService.createAuthContext(user, AuthProtocol.GRPC, {
				token,
			});

			// Attach auth data to metadata
			metadata.set('user', JSON.stringify(user));
			metadata.set('authContext', JSON.stringify(authContext));

			return true;
		} catch (error) {
			// Convert standard AppError to RpcException
			if (error instanceof AppError) {
				throw new RpcException(error);
			}

			// Log unexpected errors but don't expose details
			this.logger.error('Authentication failed with unexpected error', error.stack, { error });
			throw new RpcException(AppError.unauthorized(ErrorCodes.ERR_INVALID_TOKEN));
		}
	}
}

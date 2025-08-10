import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AuthService } from '../core';
import { AuthenticatedRequest, AuthProtocol } from '../types';

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name);

	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

		const token = this.authService.extractHttpToken(request.headers);

		if (!token) {
			this.logger.debug('No token found in authorization header');
			throw AppError.unauthorized(ErrorCodes.ERR_INVALID_TOKEN);
		}

		try {
			const user = await this.authService.validateToken(token);
			const authContext = this.authService.createAuthContext(user, AuthProtocol.HTTP, {
				correlationId: request.headers['x-correlation-id']?.toString(),
				token,
			});

			// Attach auth data to request
			request.user = user;
			request.authContext = authContext;

			return true; // Allow access
		} catch (error) {
			// Log the specific error for debugging but don't expose it to the client
			if (error instanceof Error) {
				this.logger.error(`Authentication failed: ${error.message}`, error.stack, { error });
			} else {
				this.logger.error('Authentication failed with unknown error', error.stack, { error });
			}
			throw AppError.unauthorized(ErrorCodes.ERR_INVALID_TOKEN);
		}
	}
}

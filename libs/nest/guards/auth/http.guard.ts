import { randomUUID } from 'crypto';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { RequestContextService } from '@venta/nest/modules';
import { AuthenticatedRequest, AuthProtocol } from '../types';
import { AuthService } from './auth.service';

@Injectable()
export class HttpAuthGuard implements CanActivate {
	private readonly logger = new Logger(HttpAuthGuard.name);

	constructor(
		private readonly authService: AuthService,
		private readonly requestContextService: RequestContextService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

		// Extract or generate request ID for logging (same logic as HttpRequestIdInterceptor)
		const requestId = this.getOrCreateRequestId(request);

		// We need to run within ALS context since guards execute before interceptors
		return new Promise((resolve, reject) => {
			this.requestContextService.run(async () => {
				try {
					if (requestId) {
						// Set the request ID in the request context for this guard's logging
						this.requestContextService.setRequestId(requestId);
					}

					const result = await this.validateRequest(request);
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	private async validateRequest(request: AuthenticatedRequest): Promise<boolean> {
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

	/**
	 * Extract request ID from headers or generate a new one (same logic as HttpRequestIdInterceptor)
	 */
	private getOrCreateRequestId(request: any): string | undefined {
		// Try to get request ID from headers (X-Request-ID, X-Correlation-ID, etc.)
		const requestId =
			request.headers['x-request-id'] ||
			request.headers['x-correlation-id'] ||
			request.headers['request-id'] ||
			request.headers['correlation-id'];

		if (requestId) {
			request.requestId = requestId;
			return requestId;
		}

		// If no request ID provided, generate a new one for this request
		const newRequestId = randomUUID();
		request.requestId = newRequestId;
		return newRequestId;
	}
}

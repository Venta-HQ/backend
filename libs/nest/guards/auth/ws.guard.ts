import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '@venta/apitypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';
import { AuthService } from './auth.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		private readonly requestContextService: RequestContextService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(WsAuthGuard.name);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient<AuthenticatedSocket>();
		this.logger.debug('WS auth check: start', {
			socketId: client?.id,
			hasAuthorization: typeof (client?.handshake?.headers as any)?.authorization === 'string',
		});

		const token = this.authService.extractWsToken(client.handshake);
		this.logger.debug('WS auth check: token extracted', { hasToken: !!token });

		if (!token) {
			this.logger.warn('WebSocket connection attempt without Bearer authorization token');
			throw new WsException(
				AppError.unauthorized(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'auth_check',
				}),
			);
		}

		try {
			const user = await this.authService.validateToken(token);

			// Attach auth data to socket
			client.user = user;

			// Set user context in RequestContextService for singleton services
			this.requestContextService.setUserId(user.id);
			this.requestContextService.setClerkId(user.clerkId);

			this.logger.debug('WS auth check: success', { userId: user?.id });
			return true;
		} catch (error) {
			this.logger.warn('WebSocket authentication failed', { error: (error as any)?.message });
			throw new WsException(
				AppError.unauthorized(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'auth_check',
				}),
			);
		}
	}
}

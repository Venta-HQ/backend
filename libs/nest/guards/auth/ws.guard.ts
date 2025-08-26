import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '@venta/apitypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '../../modules/core/logger/logger.service';
import { AuthService } from './auth.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(WsAuthGuard.name);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient<AuthenticatedSocket>();
		this.logger.debug('WS auth check: start', {
			socketId: client?.id,
			handshake: {
				hasAuthToken: !!client?.handshake?.auth?.token,
				hasQueryToken: typeof client?.handshake?.query?.token === 'string',
				hasAuthorization: typeof (client?.handshake?.headers as any)?.authorization === 'string',
				userId: client?.handshake?.query?.userId?.toString?.(),
			},
		});
		const token = this.authService.extractWsToken(client.handshake);
		this.logger.debug('WS auth check: token extracted', { hasToken: !!token });

		if (!token) {
			this.logger.warn('WebSocket connection attempt without token');
			throw new WsException(
				AppError.unauthorized(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'auth_check',
					userId: client.handshake.query?.userId?.toString(),
				}),
			);
		}

		try {
			const user = await this.authService.validateToken(token);

			// Attach auth data to socket
			client.user = user;
			this.logger.debug('WS auth check: success', { userId: user?.id });
			return true;
		} catch (error) {
			this.logger.warn('WebSocket authentication failed', { error: (error as any)?.message });
			throw new WsException(
				AppError.unauthorized(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'auth_check',
					userId: client.handshake.query?.userId?.toString(),
				}),
			);
		}
	}
}

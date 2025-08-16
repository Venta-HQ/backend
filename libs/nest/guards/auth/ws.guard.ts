import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '@venta/apitypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';
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
		const token = this.authService.extractWsToken(client.handshake);

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
			return true;
		} catch (error) {
			this.logger.warn('WebSocket authentication failed', { error: error.message });
			throw new WsException(
				AppError.unauthorized(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'auth_check',
					userId: client.handshake.query?.userId?.toString(),
				}),
			);
		}
	}
}

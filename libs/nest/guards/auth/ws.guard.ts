import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '@venta/apitypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AuthService } from './auth.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
	private readonly logger = new Logger(WsAuthGuard.name);

	constructor(private readonly authService: AuthService) {}

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

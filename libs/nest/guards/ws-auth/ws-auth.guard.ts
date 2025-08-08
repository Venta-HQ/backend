import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from '../core';
import { AuthenticatedSocket, AuthProtocol } from '../types';

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
				new AppError(ErrorType.UNAUTHORIZED, 'WS_AUTHENTICATION_FAILED', ErrorCodes.WS_AUTHENTICATION_FAILED),
			);
		}

		try {
			const user = await this.authService.validateToken(token);
			const authContext = this.authService.createAuthContext(user, AuthProtocol.WEBSOCKET, {
				correlationId: client.handshake.headers['x-correlation-id']?.toString(),
				token,
			});

			// Attach auth data to socket
			client.user = user;
			client.authContext = authContext;
			return true;
		} catch (error) {
			this.logger.warn('WebSocket authentication failed', { error: error.message });
			throw new WsException(
				new AppError(ErrorType.UNAUTHORIZED, 'WS_AUTHENTICATION_FAILED', ErrorCodes.WS_AUTHENTICATION_FAILED),
			);
		}
	}
}

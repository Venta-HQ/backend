import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '@venta/apitypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';

@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(
		private readonly requestContextService: RequestContextService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(WsAuthGuard.name);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient<AuthenticatedSocket>();

		// Authentication is already done by AuthenticatedSocketIoAdapter at handshake
		// This guard just sets the request context from the already-authenticated user
		if (!client.user) {
			this.logger.warn('WebSocket connection without authenticated user - handshake auth failed');
			// Emit error to client for visibility before disconnecting
			try {
				client.emit('ws_error', {
					code: ErrorCodes.ERR_WEBSOCKET_ERROR,
					message: 'Unauthorized WebSocket message: missing user context',
					operation: 'auth_context_check',
				});
			} catch {}
			throw new WsException(
				AppError.unauthorized(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'auth_context_check',
				}),
			);
		}

		// Set user context in RequestContextService for singleton services
		this.requestContextService.setUserId(client.user.id);
		this.requestContextService.setClerkId(client.user.clerkId);

		this.logger.debug('WS auth context set', { userId: client.user.id });
		return true;
	}
}

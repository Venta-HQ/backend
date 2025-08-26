import type { Server, Socket } from 'socket.io';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AuthService } from '@venta/nest/guards';
import { Logger } from '@venta/nest/modules';

export class AuthenticatedSocketIoAdapter extends IoAdapter {
	constructor(
		app: INestApplication,
		private readonly authService: AuthService,
		private readonly logger: Logger,
		private readonly config: ConfigService,
	) {
		super(app);
	}

	createIOServer(port: number, options?: any): Server {
		const server = super.createIOServer(port, options) as Server;

		const requireUserId = (this.config?.get('WS_REQUIRE_USER_ID') ?? 'true') !== 'false';
		const enforceUserIdMatch = (this.config?.get('WS_ENFORCE_USER_ID_MATCH') ?? 'true') !== 'false';
		const userIdQueryKey = this.config?.get('WS_USER_ID_QUERY_KEY') || 'userId';
		const isProd = this.config?.get('NODE_ENV') === 'production';
		const verbose = this.config?.get('WS_LOG_HANDSHAKES') === 'true';

		server.of(/^\/.*/).use(async (socket: Socket, next) => {
			try {
				const token = this.authService.extractWsToken(socket.handshake);
				const userIdFromQuery = (socket.handshake.query as any)?.[userIdQueryKey]?.toString?.();

				if (!token) {
					this.logger.warn('WS handshake rejected: missing token', { socketId: socket.id });
					return next(new Error('ERR_UNAUTHORIZED: missing token'));
				}
				if (requireUserId && !userIdFromQuery) {
					this.logger.warn('WS handshake rejected: missing userId', { socketId: socket.id });
					return next(new Error('ERR_UNAUTHORIZED: missing userId'));
				}

				const user = await this.authService.validateToken(token);
				(socket as any).user = user;

				if (enforceUserIdMatch && userIdFromQuery && userIdFromQuery !== user.id) {
					this.logger.warn('WS handshake rejected: userId mismatch', {
						socketId: socket.id,
						queryUserId: userIdFromQuery,
						userId: user.id,
					});
					return next(new Error('ERR_FORBIDDEN: userId mismatch'));
				}

				if (!isProd || verbose) {
					this.logger.debug('WS handshake accepted', { socketId: socket.id, userId: user.id });
				}

				return next();
			} catch (err: any) {
				try {
					this.logger.warn('WS handshake auth failed', { socketId: socket.id, error: err?.message });
				} catch {}
				return next(new Error('ERR_INVALID_TOKEN'));
			}
		});

		return server;
	}
}

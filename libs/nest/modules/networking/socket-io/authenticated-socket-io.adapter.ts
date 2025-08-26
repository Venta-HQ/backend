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

		const isProd = this.config?.get('NODE_ENV') === 'production';
		const verbose = this.config?.get('WS_LOG_HANDSHAKES') === 'true';

		server.of(/^\/.*/).use(async (socket: Socket, next) => {
			try {
				// Standardized: Only accept Bearer authorization headers like HTTP
				const token = this.authService.extractWsToken(socket.handshake);

				if (!token) {
					this.logger.warn('WS handshake rejected: missing Bearer authorization token', { socketId: socket.id });
					return next(new Error('ERR_UNAUTHORIZED: missing Bearer authorization token'));
				}

				const user = await this.authService.validateToken(token);
				(socket as any).user = user;

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

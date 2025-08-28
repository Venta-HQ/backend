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
		const maxHttpBufferSize = Number(this.config?.get('WS_MAX_PAYLOAD_BYTES') ?? 65536);
		const pingInterval = Number(this.config?.get('WS_PING_INTERVAL_MS') ?? 25000);
		const pingTimeout = Number(this.config?.get('WS_PING_TIMEOUT_MS') ?? 60000);
		const allowedOriginsEnv = this.config?.get<string>('ALLOWED_ORIGINS');
		const corsOrigin = allowedOriginsEnv
			? allowedOriginsEnv
					.split(',')
					.map((o) => o.trim())
					.filter(Boolean)
			: ['http://localhost:3000', 'http://localhost:3001'];

		const mergedOptions = {
			...options,
			maxHttpBufferSize,
			pingInterval,
			pingTimeout,
			cors: {
				origin: corsOrigin,
				credentials: true,
			},
		};

		const server = super.createIOServer(port, mergedOptions) as Server;

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

		// Graceful shutdown: close WS server on process signals
		let closed = false;
		const shutdown = (signal: string) => {
			if (closed) return;
			closed = true;
			try {
				this.logger.warn('Shutting down WebSocket server', { signal });
				server.close((err?: Error) => {
					if (err) this.logger.error('Error while closing WS server', err.stack);
				});
			} catch (e: any) {
				try {
					this.logger.error('Unhandled error during WS shutdown', e?.stack);
				} catch {}
			}
		};
		process.once('SIGTERM', () => shutdown('SIGTERM'));
		process.once('SIGINT', () => shutdown('SIGINT'));

		return server;
	}
}

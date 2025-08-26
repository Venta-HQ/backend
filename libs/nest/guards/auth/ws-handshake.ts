import type { Server, Socket } from 'socket.io';
import { Logger } from '@venta/nest/modules';
import { AuthService } from './auth.service';

export interface WsHandshakeAuthOptions {
	requireUserId?: boolean;
	enforceUserIdMatch?: boolean;
	userIdQueryKey?: string;
}

export function registerWsNamespaceAuth(
	server: Server,
	namespacePath: string,
	deps: { authService: AuthService; logger: Logger; options?: WsHandshakeAuthOptions },
): void {
	const { authService, logger, options } = deps;
	const requireUserId = options?.requireUserId ?? true;
	const enforceUserIdMatch = options?.enforceUserIdMatch ?? true;
	const userIdQueryKey = options?.userIdQueryKey ?? 'userId';

	const namespace = server.of(namespacePath);

	namespace.use(async (socket: Socket, next) => {
		try {
			const token = authService.extractWsToken(socket.handshake);
			const userIdFromQuery = (socket.handshake.query as any)?.[userIdQueryKey]?.toString?.();

			if (!token) return next(new Error('ERR_UNAUTHORIZED: missing token'));
			if (requireUserId && !userIdFromQuery) return next(new Error('ERR_UNAUTHORIZED: missing userId'));

			const user = await authService.validateToken(token);
			(socket as any).user = user;

			if (enforceUserIdMatch && userIdFromQuery && userIdFromQuery !== user.id) {
				return next(new Error('ERR_FORBIDDEN: userId mismatch'));
			}

			return next();
		} catch (err: any) {
			try {
				logger.warn('WS handshake auth failed', { socketId: socket.id, error: err?.message });
			} catch {}
			return next(new Error('ERR_INVALID_TOKEN'));
		}
	});
}

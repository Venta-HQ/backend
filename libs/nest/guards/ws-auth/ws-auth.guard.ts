import { Socket } from 'socket.io';
import { AppError, ErrorType } from '@app/nest/errors';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../../modules';

interface AuthenticatedSocket extends Socket {
	clerkId?: string;
	userId?: string;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
	private readonly logger = new Logger(WsAuthGuard.name);

	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient<AuthenticatedSocket>();
		const token = this.extractToken(client);

		if (!token) {
			this.logger.warn('WebSocket connection attempt without token');
			throw new WsException(
				new AppError(ErrorType.AUTHENTICATION, 'WS_AUTHENTICATION_FAILED', 'WebSocket authentication failed'),
			);
		}

		try {
			const user = await this.validateToken(token);
			this.attachUserToSocket(client, user);
			return true;
		} catch (error) {
			this.logger.warn('WebSocket authentication failed', { error: error.message });
			throw new WsException(
				new AppError(ErrorType.AUTHENTICATION, 'WS_AUTHENTICATION_FAILED', 'WebSocket authentication failed'),
			);
		}
	}

	private extractToken(client: AuthenticatedSocket): string | null {
		// Try to get token from handshake auth
		const auth = client.handshake.auth;
		if (auth?.token) {
			return auth.token;
		}

		// Try to get token from query parameters
		const query = client.handshake.query;
		if (query?.token && typeof query.token === 'string') {
			return query.token;
		}

		// Try to get token from headers
		const headers = client.handshake.headers;
		if (headers?.authorization) {
			const authHeader = headers.authorization;
			if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
				return authHeader.substring(7);
			}
		}

		return null;
	}

	private async validateToken(token: string): Promise<any> {
		// For now, we'll use a simple validation approach
		// In a real implementation, you'd validate the token with Clerk or your auth service
		const user = await this.prisma.db.user.findFirst({
			where: {
				clerkId: token, // Assuming token is the clerkId for now
			},
		});

		if (!user) {
			throw new AppError(ErrorType.AUTHENTICATION, 'WS_AUTHENTICATION_FAILED', 'WebSocket authentication failed');
		}

		return user;
	}

	private attachUserToSocket(client: AuthenticatedSocket, user: any): void {
		client.clerkId = user.clerkId;
		client.userId = user.id;
	}
}

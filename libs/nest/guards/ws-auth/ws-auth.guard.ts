import Redis from 'ioredis';
import { ErrorCodes, WsError } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ClerkService } from '../../modules/clerk';

@Injectable()
export class WsAuthGuard implements CanActivate {
	private readonly logger = new Logger(WsAuthGuard.name);

	constructor(
		private readonly clerkService: ClerkService,
		private prisma: PrismaService,
		@InjectRedis() private redis: Redis,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient();
		const data = context.switchToWs().getData();

		// Extract token from handshake auth or query parameters
		const token = this.extractToken(client);

		if (!token) {
			this.logger.debug('No authentication token provided in WebSocket connection');
			throw new WsError('WS_AUTHENTICATION_FAILED');
		}

		try {
			// Use Clerk to verify the session token
			const tokenContents = await this.clerkService.verifyToken(token);

			// Fetch our user using a redis cache to avoid overfetching
			let internalUserId = await this.redis.get(`user:${tokenContents.sub}`);

			if (!internalUserId) {
				const internalUser = await this.prisma.db.user.findFirst({
					select: {
						id: true,
					},
					where: {
						clerkId: tokenContents.sub,
					},
				});

				if (!internalUser) {
					this.logger.warn(`User not found in database for clerk ID: ${tokenContents.sub}`);
					throw new WsError('WS_AUTHENTICATION_FAILED');
				}

				internalUserId = internalUser.id;

				// Cache the result
				await this.redis.set(`user:${tokenContents.sub}`, internalUserId, 'EX', 3600); // 3600 = 1hr
			}

			// Attach the user info to the socket for further use
			client.userId = internalUserId;
			client.clerkId = tokenContents.sub;

			return true; // Allow access
		} catch (error) {
			// Log the specific error for debugging but don't expose it to the client
			if (error instanceof Error) {
				this.logger.error(`WebSocket authentication failed: ${error.message}`, error.stack);
			} else {
				this.logger.error('WebSocket authentication failed with unknown error', error);
			}
			throw new WsError('WS_AUTHENTICATION_FAILED');
		}
	}

	private extractToken(client: any): string | null {
		// Try to get token from handshake auth
		if (client.handshake?.auth?.token) {
			return client.handshake.auth.token;
		}

		// Try to get token from query parameters
		if (client.handshake?.query?.token) {
			return client.handshake.query.token;
		}

		// Try to get token from headers
		const authHeader = client.handshake?.headers?.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}

		return null;
	}
}

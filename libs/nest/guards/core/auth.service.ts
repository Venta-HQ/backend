import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { ClerkService } from '../../modules/external/clerk';
import { AuthContext, AuthProtocol, AuthUser } from '../types';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly clerkService: ClerkService,
		private readonly prisma: PrismaService,
		@InjectRedis() private readonly redis: Redis,
	) {}

	/**
	 * Validates a token and returns the authenticated user
	 */
	async validateToken(token: string): Promise<AuthUser> {
		try {
			// Use Clerk to verify the session token
			const tokenContents = await this.clerkService.verifyToken(token);

			// Fetch our user using a redis cache to avoid overfetching
			let internalUserId = await this.redis.get(`user:${tokenContents.sub}`);

			if (!internalUserId) {
				const internalUser = await this.prisma.db.user.findFirst({
					select: {
						id: true,
						clerkId: true,
					},
					where: {
						clerkId: tokenContents.sub,
					},
				});

				if (!internalUser) {
					this.logger.warn(`User not found in database for clerk ID: ${tokenContents.sub}`);
					throw AppError.unauthorized('USER_NOT_FOUND', ErrorCodes.USER_NOT_FOUND, {
						userId: tokenContents.sub,
					});
				}

				internalUserId = internalUser.id;

				// Cache the result
				await this.redis.set(`user:${tokenContents.sub}`, internalUserId, 'EX', 3600); // 3600 = 1hr
			}

			return {
				id: internalUserId,
				clerkId: tokenContents.sub,
			};
		} catch (error) {
			// Log the specific error for debugging but don't expose it to the client
			if (error instanceof Error) {
				this.logger.error(`Authentication failed: ${error.message}`, error.stack, { error });
			} else {
				this.logger.error('Authentication failed with unknown error', error.stack, { error });
			}
			throw AppError.unauthorized('INVALID_TOKEN', ErrorCodes.INVALID_TOKEN);
		}
	}

	/**
	 * Creates an auth context for a user
	 */
	createAuthContext(
		user: AuthUser,
		protocol: AuthProtocol,
		options: {
			correlationId?: string;
			token?: string;
			metadata?: Record<string, unknown>;
		} = {},
	): AuthContext {
		return {
			user,
			correlationId: options.correlationId || randomUUID(),
			timestamp: Date.now(),
			metadata: {
				protocol,
				token: options.token,
				...options.metadata,
			},
		};
	}

	/**
	 * Extracts a token from HTTP headers
	 */
	extractHttpToken(headers: Record<string, string | string[]>): string | null {
		const authHeader = headers['authorization'];
		if (!authHeader) return null;

		const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
		if (!token?.startsWith('Bearer ')) return null;

		return token.substring(7);
	}

	/**
	 * Extracts a token from WebSocket handshake
	 */
	extractWsToken(handshake: any): string | null {
		// Try to get token from handshake auth
		const auth = handshake.auth;
		if (auth?.token) {
			return auth.token;
		}

		// Try to get token from query parameters
		const query = handshake.query;
		if (query?.token && typeof query.token === 'string') {
			return query.token;
		}

		// Try to get token from headers
		const headers = handshake.headers;
		if (headers?.authorization) {
			const authHeader = headers.authorization;
			if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
				return authHeader.substring(7);
			}
		}

		return null;
	}

	/**
	 * Extracts a token from gRPC metadata
	 */
	extractGrpcToken(metadata: any): string | null {
		// Try to get token from authorization metadata
		const auth = metadata.get('authorization')?.[0];
		if (auth?.startsWith('Bearer ')) {
			return auth.substring(7);
		}

		// Try to get token directly
		const token = metadata.get('token')?.[0];
		if (token) {
			return token;
		}

		return null;
	}
}

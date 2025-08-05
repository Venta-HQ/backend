import Redis from 'ioredis';
import { Socket } from 'socket.io';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface RateLimitedSocket extends Socket {
	clerkId?: string;
	userId?: string;
}

@Injectable()
export class WsRateLimitGuard implements CanActivate {
	private readonly logger = new Logger(WsRateLimitGuard.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient<RateLimitedSocket>();
		const userId = client.clerkId || client.userId || client.id;

		const key = `ws_rate_limit:${userId}`;
		const limit = 100; // 100 messages per minute
		const window = 60; // 1 minute window

		try {
			const current = await this.redis.incr(key);

			// Set expiry on first request
			if (current === 1) {
				await this.redis.expire(key, window);
			}

			if (current > limit) {
				this.logger.warn(`Rate limit exceeded for user: ${userId}`);
				throw new WsException(new AppError('RATE_LIMIT_EXCEEDED', ErrorCodes.RATE_LIMIT_EXCEEDED));
			}

			return true;
		} catch (error) {
			if (error instanceof WsException) {
				throw error;
			}
			this.logger.error('Rate limit check failed', error);
			return true; // Allow on error to prevent blocking legitimate requests
		}
	}
}

import Redis from 'ioredis';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '@venta/apitypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';

@Injectable()
export class WsRateLimitGuard implements CanActivate {
	private readonly logger = new Logger(WsRateLimitGuard.name);
	private readonly windowMs: number;
	private readonly maxRequests: number;
	constructor(
		protected readonly redis: Redis,
		windowMs: number,
		maxRequests: number,
	) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient<AuthenticatedSocket>();
		const key = `ws-rate-limit:${client.id}`;
		const now = Date.now();

		const multi = this.redis.multi();
		multi.zremrangebyscore(key, 0, now - this.windowMs); // Remove expired entries
		multi.zcard(key); // Get count of remaining entries
		multi.zadd(key, now, now.toString()); // Add current timestamp
		multi.pexpire(key, this.windowMs); // Set expiry

		const results = await multi.exec();
		const count = results?.[1]?.[1] as number;

		if (count >= this.maxRequests) {
			this.logger.warn('Rate limit exceeded', { clientId: client.id });
			throw new WsException(
				AppError.validation(ErrorCodes.ERR_RATE_LIMIT_EXCEEDED, {
					retryAfterSeconds: Math.ceil(this.windowMs / 1000),
					userId: client.user?.id,
				}),
			);
		}

		return true;
	}
}

import Redis from 'ioredis';
import { WsError } from '@app/nest/errors';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';

export interface WsRateLimitOptions {
	limit: number; // Number of requests allowed
	windowMs: number; // Time window in milliseconds
	keyPrefix?: string; // Redis key prefix
	skipSuccessfulRequests?: boolean; // Skip counting successful requests
	skipFailedRequests?: boolean; // Skip counting failed requests
}

@Injectable()
export class WsRateLimitGuard implements CanActivate {
	private readonly logger = new Logger(WsRateLimitGuard.name);
	private readonly options: Required<WsRateLimitOptions>;

	constructor(
		@InjectRedis() private readonly redis: Redis,
		options: WsRateLimitOptions,
	) {
		this.options = {
			keyPrefix: 'ws_rate_limit:',
			skipSuccessfulRequests: false,
			skipFailedRequests: false,
			...options,
		};
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient();
		const key = this.generateKey(client);

		try {
			const current = await this.redis.incr(key);
			
			// Set expiry on first request
			if (current === 1) {
				await this.redis.expire(key, Math.ceil(this.options.windowMs / 1000));
			}

			// Check if limit exceeded
			if (current > this.options.limit) {
				this.logger.warn(`Rate limit exceeded for ${key}: ${current}/${this.options.limit}`);
				throw new WsError('RATE_LIMIT_EXCEEDED');
			}

			return true;
		} catch (error) {
			if (error instanceof WsError) {
				throw error;
			}
			
			this.logger.error(`Rate limiting error for ${key}:`, error);
			// Allow request if rate limiting fails
			return true;
		}
	}

	private generateKey(client: any): string {
		const userId = client.userId || 'anonymous';
		const socketId = client.id || 'unknown';
		const event = this.getEventName(client);
		
		return `${this.options.keyPrefix}${userId}:${event}:${socketId}`;
	}

	private getEventName(client: any): string {
		// Try to get event name from the current context
		// This might need adjustment based on how you access the event name
		return 'default';
	}

	/**
	 * Reset rate limit for a specific key
	 */
	async resetLimit(key: string): Promise<void> {
		await this.redis.del(key);
	}

	/**
	 * Get current rate limit status for a key
	 */
	async getLimitStatus(key: string): Promise<{ current: number; limit: number; remaining: number; resetTime: number }> {
		const current = await this.redis.get(key);
		const ttl = await this.redis.ttl(key);
		
		const currentCount = current ? parseInt(current, 10) : 0;
		const remaining = Math.max(0, this.options.limit - currentCount);
		const resetTime = ttl > 0 ? Date.now() + (ttl * 1000) : Date.now();

		return {
			current: currentCount,
			limit: this.options.limit,
			remaining,
			resetTime,
		};
	}
} 
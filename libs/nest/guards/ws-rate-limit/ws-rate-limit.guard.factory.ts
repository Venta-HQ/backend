import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { WsRateLimitGuard, WsRateLimitOptions } from './ws-rate-limit.guard';

/**
 * Injectable rate limiting guards with pre-configured options
 */
@Injectable()
export class WsRateLimitGuardLenient extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis, {
			limit: 30,
			windowMs: 60000, // 30 requests per minute
		});
	}
}

@Injectable()
export class WsRateLimitGuardStandard extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis, {
			limit: 15,
			windowMs: 60000, // 15 requests per minute
		});
	}
}

@Injectable()
export class WsRateLimitGuardStatus extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis, {
			limit: 60,
			windowMs: 60000, // 60 requests per minute
		});
	}
}

@Injectable()
export class WsRateLimitGuardStrict extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis, {
			limit: 5,
			windowMs: 60000, // 5 requests per minute
		});
	}
}

/**
 * Pre-configured rate limiting guards for common use cases
 */
export const WsRateLimitGuards = {
	// Lenient rate limiting for frequent operations
	lenient: WsRateLimitGuardLenient,

	// Standard rate limiting for normal operations
	standard: WsRateLimitGuardStandard,

	// Very lenient rate limiting for status checks
	status: WsRateLimitGuardStatus,

	// Strict rate limiting for critical operations
	strict: WsRateLimitGuardStrict,
};

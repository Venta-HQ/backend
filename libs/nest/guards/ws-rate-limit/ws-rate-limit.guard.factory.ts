import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { Logger } from '@venta/nest/modules';
import { WsRateLimitGuard } from './ws-rate-limit.guard';

/**
 * Injectable rate limiting guards with pre-configured options
 */
@Injectable()
export class WsRateLimitGuardLenient extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: Redis, logger: Logger) {
		super(redis, 5000, 50, logger); // 50 requests per 5 seconds - lenient
	}
}

@Injectable()
export class WsRateLimitGuardStandard extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: Redis, logger: Logger) {
		super(redis, 1000, 10, logger); // 10 requests per second - standard
	}
}

@Injectable()
export class WsRateLimitGuardStatus extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: Redis, logger: Logger) {
		super(redis, 1000, 100, logger); // 100 requests per second - very lenient for status checks
	}
}

@Injectable()
export class WsRateLimitGuardStrict extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: Redis, logger: Logger) {
		super(redis, 1000, 5, logger); // 5 requests per second - strict
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

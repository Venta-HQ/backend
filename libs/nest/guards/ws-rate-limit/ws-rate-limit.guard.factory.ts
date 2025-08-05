import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { WsRateLimitGuard } from './ws-rate-limit.guard';

/**
 * Injectable rate limiting guards with pre-configured options
 */
@Injectable()
export class WsRateLimitGuardLenient extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis);
	}
}

@Injectable()
export class WsRateLimitGuardStandard extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis);
	}
}

@Injectable()
export class WsRateLimitGuardStatus extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis);
	}
}

@Injectable()
export class WsRateLimitGuardStrict extends WsRateLimitGuard {
	constructor(@InjectRedis() redis: any) {
		super(redis);
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

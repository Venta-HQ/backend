import { WsRateLimitGuard, WsRateLimitOptions } from './ws-rate-limit.guard';

/**
 * Factory function to create WebSocket rate limiting guards
 * This allows the guard to be used in decorators where 'this' context is not available
 */
export function createWsRateLimitGuard(options: WsRateLimitOptions) {
	return class extends WsRateLimitGuard {
		constructor(redis: any) {
			super(redis, options);
		}
	};
}

/**
 * Pre-configured rate limiting guards for common use cases
 */
export const WsRateLimitGuards = {
	// Lenient rate limiting for frequent operations
	lenient: createWsRateLimitGuard({
		limit: 30,
		windowMs: 60000, // 30 requests per minute
	}),

	// Standard rate limiting for normal operations
	standard: createWsRateLimitGuard({
		limit: 15,
		windowMs: 60000, // 15 requests per minute
	}),

	// Very lenient rate limiting for status checks
	status: createWsRateLimitGuard({
		limit: 60,
		windowMs: 60000, // 60 requests per minute
	}),
	// Strict rate limiting for critical operations
	strict: createWsRateLimitGuard({
		limit: 5,
		windowMs: 60000, // 5 requests per minute
	}),
};

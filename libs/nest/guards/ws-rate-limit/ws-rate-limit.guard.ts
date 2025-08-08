import { AppError, ErrorCodes } from '@app/nest/errors';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '../types';

@Injectable()
export class WsRateLimitGuard implements CanActivate {
	private readonly logger = new Logger(WsRateLimitGuard.name);
	private readonly windowMs: number;
	private readonly maxRequests: number;
	private readonly store = new Map<string, number[]>();

	constructor(windowMs: number, maxRequests: number) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
	}

	canActivate(context: ExecutionContext): boolean {
		const client = context.switchToWs().getClient<AuthenticatedSocket>();
		const now = Date.now();

		// Get user's request timestamps
		const timestamps = this.store.get(client.id) || [];

		// Remove expired timestamps
		const validTimestamps = timestamps.filter((timestamp) => now - timestamp < this.windowMs);

		if (validTimestamps.length >= this.maxRequests) {
			this.logger.warn('Rate limit exceeded', { clientId: client.id });
			throw new WsException(
				AppError.validation(ErrorCodes.ERR_WS_RATE_LIMIT, {
					userId: client.user?.id,
				}),
			);
		}

		// Add current timestamp and update store
		validTimestamps.push(now);
		this.store.set(client.id, validTimestamps);

		return true;
	}
}

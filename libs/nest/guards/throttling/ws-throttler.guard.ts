import { ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrometheusService } from '@venta/nest/modules';
import { Logger } from '../../modules/core/logger/logger.service';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
	constructor(
		options: any,
		storageService: any,
		reflector: Reflector,
		@Inject(Logger) private readonly logger: Logger,
		@Optional() private readonly prometheus?: PrometheusService,
	) {
		super(options, storageService, reflector);
		this.logger.setContext(WsThrottlerGuard.name);
	}

	/**
	 * Override HTTP-specific request/response extraction for WebSocket contexts.
	 * Returns a minimal HTTP-like shape so base ThrottlerGuard logic works without headers support.
	 */
	protected getRequestResponse(context: ExecutionContext): { req: any; res: any } {
		const client: any = context.switchToWs().getClient();
		const headers = client?.handshake?.headers ?? {};
		const ip =
			client?.handshake?.address ||
			client?.conn?.remoteAddress ||
			client?._socket?.remoteAddress ||
			client?.request?.socket?.remoteAddress ||
			'0.0.0.0';

		// Provide a no-op header function to satisfy base guard's header writes
		const res = { header: (_key: string, _value: any) => void 0 };

		return { req: { headers, ip }, res };
	}

	protected throwThrottlingException(context: ExecutionContext, throttlerLimitDetail?: any): never {
		try {
			const client: any = context.switchToWs().getClient();
			const socketId = client?.id;

			// increment metric if available
			try {
				const inc = (this.prometheus as any)?.getMetric?.('user_websocket_errors_total')?.inc;
				inc?.({ type: 'rate_limit' });
			} catch {}

			const retryAfterSeconds = throttlerLimitDetail?.timeToBlockExpire ?? throttlerLimitDetail?.timeToExpire ?? 60;

			this.logger.warn('WebSocket rate limit exceeded', { socketId, retryAfterSeconds });

			// Emit error directly in guard since interceptors don't catch guard-stage errors
			try {
				client?.emit?.(
					'ws_error',
					AppError.validation(ErrorCodes.ERR_RATE_LIMIT_EXCEEDED, {
						retryAfterSeconds,
						socketId,
					})
						.toWsException()
						.getError(),
				);
			} catch {}

			throw new WsException(
				AppError.validation(ErrorCodes.ERR_RATE_LIMIT_EXCEEDED, {
					retryAfterSeconds,
					socketId,
				}),
			);
		} catch (e) {
			throw new WsException('Too Many Requests');
		}
	}
}

import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, PrometheusService } from '@venta/nest/modules';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
	constructor(
		options: any,
		storageService: any,
		reflector: Reflector,
		private readonly logger: Logger,
		private readonly prometheus: PrometheusService,
	) {
		super(options, storageService, reflector);
		this.logger.setContext(WsThrottlerGuard.name);
	}

	protected throwThrottlingException(context: ExecutionContext): never {
		try {
			const client: any = context.switchToWs().getClient();
			const socketId = client?.id;

			// increment metric if available
			try {
				const inc = (this.prometheus as any)?.getMetric?.('user_websocket_errors_total')?.inc;
				inc?.({ type: 'rate_limit' });
			} catch {}

			this.logger.warn('WebSocket rate limit exceeded', { socketId });
			throw new WsException(
				AppError.validation(ErrorCodes.ERR_RATE_LIMIT_EXCEEDED, {
					retryAfterSeconds: 60,
					socketId,
				}),
			);
		} catch (e) {
			throw new WsException('Too Many Requests');
		}
	}
}

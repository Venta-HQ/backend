import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';
import { BaseRequestIdInterceptor, RequestIdExtractor } from './base-request-id.interceptor';

class WsRequestIdExtractor implements RequestIdExtractor {
	extractId(context: ExecutionContext): string | undefined {
		const ws = context.switchToWs();
		const client: any = ws.getClient();
		const handshake = client?.handshake;
		const headers = handshake?.headers ?? {};
		return headers['x-request-id'] || headers['x-correlation-id'] || headers['request-id'] || headers['correlation-id'];
	}

	getProtocolName(): string {
		return 'WebSocket request';
	}
}

@Injectable()
export class WsRequestIdInterceptor extends BaseRequestIdInterceptor {
	constructor(requestContextService: RequestContextService, @Inject(Logger) logger: Logger) {
		super(requestContextService, new WsRequestIdExtractor(), logger);
	}
}

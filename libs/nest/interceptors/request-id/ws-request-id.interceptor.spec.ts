import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';
import { WsRequestIdInterceptor } from './ws-request-id.interceptor';

describe('WsRequestIdInterceptor', () => {
	it('reads x-request-id from websocket handshake headers', async () => {
		const rcs = new RequestContextService();
		const setSpy = vi.spyOn(rcs, 'setRequestId');
		const logger = new Logger();
		const interceptor = new WsRequestIdInterceptor(rcs, logger as any);

		const client = { handshake: { headers: { 'x-request-id': 'rid-2' } } } as any;
		const ctx: ExecutionContext = {
			switchToWs: () => ({ getClient: () => client }),
		} as any;
		const next: CallHandler = { handle: vi.fn().mockReturnValue(of(1)) } as any;

		await new Promise<void>((resolve) => {
			(interceptor.intercept(ctx, next as any) as any).subscribe({ complete: resolve });
		});
		expect(setSpy).toHaveBeenCalledWith('rid-2');
	});
});

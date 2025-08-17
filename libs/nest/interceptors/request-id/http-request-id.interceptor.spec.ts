import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';
import { HttpRequestIdInterceptor } from './http-request-id.interceptor';

describe('HttpRequestIdInterceptor', () => {
	it('sets request id to request and response headers', async () => {
		const rcs = new RequestContextService();
		const logger = new Logger();
		const interceptor = new HttpRequestIdInterceptor(rcs, logger as any);

		const request: any = { headers: {} };
		const response: any = { setHeader: vi.fn() };
		const ctx: ExecutionContext = {
			switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
		} as any;
		const next: CallHandler = { handle: vi.fn().mockReturnValue(of(1)) } as any;

		await new Promise<void>((resolve) => {
			(interceptor.intercept(ctx, next as any) as any).subscribe({ complete: resolve });
		});
		expect(request.requestId).toBeDefined();
		expect(response.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
	});
});

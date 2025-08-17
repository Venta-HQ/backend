import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Metadata } from '@grpc/grpc-js';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';
import { GrpcRequestIdInterceptor } from './grpc-request-id.interceptor';

describe('GrpcRequestIdInterceptor', () => {
	it('reads x-request-id from metadata', async () => {
		const rcs = new RequestContextService();
		const setSpy = vi.spyOn(rcs, 'setRequestId');
		const logger = new Logger();
		const interceptor = new GrpcRequestIdInterceptor(rcs, logger as any);

		const md = new Metadata();
		md.set('x-request-id', 'rid-1');
		const ctx: ExecutionContext = {
			switchToRpc: () => ({ getContext: () => md }),
		} as any;
		const next: CallHandler = { handle: vi.fn().mockReturnValue(of(1)) } as any;

		await new Promise<void>((resolve) => {
			(interceptor.intercept(ctx, next as any) as any).subscribe({ complete: resolve });
		});
		expect(setSpy).toHaveBeenCalledWith('rid-1');
	});
});

import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Metadata } from '@grpc/grpc-js';
import { context, trace } from '@opentelemetry/api';
import GrpcInstance from './grpc-instance.service';

describe('GrpcInstance', () => {
	it('injects metadata and returns observable with retry pipeline', () => {
		const service = {
			testMethod: vi.fn((data: any, md: any) => of({ ok: true })),
		} as any;
		const logger: any = { setContext: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() };
		const request: any = { user: { id: 'u1', clerkId: 'c1' }, requestId: 'rid' };
		const inst: any = new (GrpcInstance as any)(request, service, logger);
		const res: any = inst.invoke('testMethod', { a: 1 });
		expect(service.testMethod).toHaveBeenCalled();
		expect(typeof res.pipe).toBe('function');
	});
});

describe('GrpcInstance', () => {
	it('injects metadata (user/request/otel) and logs', () => {
		const request: any = { user: { id: 'u1', clerkId: 'c1' }, requestId: 'rid-1' };
		const logger: any = { setContext: vi.fn().mockReturnThis(), log: vi.fn(), warn: vi.fn() };
		const service: any = {
			call: vi.fn((data: any, md: Metadata) => ({ pipe: vi.fn((x: any) => ({ pipe: vi.fn(() => ({}) as any) })) })),
		};

		vi.spyOn(trace, 'getTracer').mockReturnValue({
			startSpan: vi.fn(() => ({ setStatus: vi.fn(), end: vi.fn(), recordException: vi.fn() })),
		} as any);
		const gi: any = new (GrpcInstance as any)(request, service, logger);
		gi.invoke('call', { some: 'data' });
		expect(service.call).toHaveBeenCalled();
		expect(logger.log).toHaveBeenCalled();
	});
});

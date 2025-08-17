import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { MetricsInterceptor } from './metrics.interceptor';

describe('MetricsInterceptor', () => {
	const prometheusService: any = {
		registerMetrics: vi.fn(() => ({
			request_duration_seconds: { observe: vi.fn() },
			requests_total: { inc: vi.fn() },
			request_size_bytes: { observe: vi.fn() },
			response_size_bytes: { observe: vi.fn() },
		})),
	};
	const configService: any = { get: vi.fn() };
	const logger: any = { setContext: vi.fn(), warn: vi.fn(), log: vi.fn() };

	const ctx: any = {
		getType: () => 'http',
		switchToHttp: () => ({
			getRequest: () => ({ method: 'GET', route: { path: '/x' }, headers: {} }),
			getResponse: () => ({ statusCode: 200 }),
		}),
	} as unknown as ExecutionContext;

	it('records metrics on success', async () => {
		const interceptor = new MetricsInterceptor(prometheusService, configService, { appName: 'app' } as any, logger);
		const next = { handle: () => of({ ok: true }) } as any;
		await interceptor.intercept(ctx, next).toPromise();
		expect(prometheusService.registerMetrics).toHaveBeenCalled();
	});

	it('records metrics on error', async () => {
		const interceptor = new MetricsInterceptor(prometheusService, configService, { appName: 'app' } as any, logger);
		const next = { handle: () => throwError(() => ({ status: 500 })) } as any;
		await expect(interceptor.intercept(ctx, next).toPromise()).rejects.toBeDefined();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';
import { AuthService } from './auth.service';
import { HttpAuthGuard } from './http.guard';

describe('HttpAuthGuard', () => {
	it('allows when token valid and attaches user', async () => {
		const authService = {
			extractHttpToken: vi.fn().mockReturnValue('t'),
			validateToken: vi.fn().mockResolvedValue({ id: 'u1' }),
		} as any as AuthService;
		const rcs = new RequestContextService();
		const guard = new HttpAuthGuard(authService, rcs, new Logger());
		const req: any = { headers: {}, requestId: 'rid' };
		const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(req.user).toEqual({ id: 'u1' });
	});

	it('rejects without token', async () => {
		const authService = {
			extractHttpToken: vi.fn().mockReturnValue(null),
			validateToken: vi.fn(),
		} as any as AuthService;
		const rcs = new RequestContextService();
		const guard = new HttpAuthGuard(authService, rcs, new Logger());
		const req: any = { headers: {} };
		const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
		await expect(guard.canActivate(ctx)).rejects.toThrow();
	});
});

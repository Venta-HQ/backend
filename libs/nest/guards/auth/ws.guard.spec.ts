import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { AuthService } from './auth.service';
import { WsAuthGuard } from './ws.guard';

describe('WsAuthGuard', () => {
	it('allows when token valid and attaches user', async () => {
		const authService = {
			extractWsToken: vi.fn().mockReturnValue('t'),
			validateToken: vi.fn().mockResolvedValue({ id: 'u1' }),
		} as any as AuthService;
		const guard = new WsAuthGuard(authService, new Logger());
		const client: any = { handshake: { query: {}, headers: {}, auth: {} } };
		const ctx = { switchToWs: () => ({ getClient: () => client }) } as unknown as ExecutionContext;
		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(client.user).toEqual({ id: 'u1' });
	});

	it('rejects without token', async () => {
		const authService = { extractWsToken: vi.fn().mockReturnValue(null), validateToken: vi.fn() } as any as AuthService;
		const guard = new WsAuthGuard(authService, new Logger());
		const client: any = { handshake: { query: {}, headers: {}, auth: {} } };
		const ctx = { switchToWs: () => ({ getClient: () => client }) } as unknown as ExecutionContext;
		await expect(guard.canActivate(ctx)).rejects.toThrow();
	});
});

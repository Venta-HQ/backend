import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Logger } from '@venta/nest/modules';
import { WsThrottlerGuard } from './ws-throttler.guard';

describe('WsThrottlerGuard', () => {
	it('throws WsException with AppError payload when throttled', () => {
		const fakeProm = { getMetric: () => ({ inc: vi.fn() }) } as any;
		const guard = new WsThrottlerGuard({} as any, {} as any, new Reflector(), new Logger(), fakeProm);
		const ctx = {
			switchToWs: () => ({ getClient: () => ({ id: 'socket-1' }) }),
		} as unknown as ExecutionContext;
		try {
			guard['throwThrottlingException'](ctx);
			expect.unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(WsException);
		}
	});
});

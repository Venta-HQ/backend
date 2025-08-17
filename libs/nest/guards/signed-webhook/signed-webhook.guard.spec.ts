import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { SignedWebhookGuard } from './signed-webhook.guard';

describe('SignedWebhookGuard', () => {
	it('returns false on invalid signature', () => {
		const Guard = SignedWebhookGuard('secret');
		const guard = new Guard();
		const req: any = { rawBody: Buffer.from('payload'), headers: {} };
		const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
		expect(guard.canActivate(ctx)).toBe(false);
	});
});

import { describe, expect, it, vi } from 'vitest';
import { ClerkService } from './clerk.service';

vi.mock('@clerk/clerk-sdk-node', () => ({
	verifyToken: vi.fn(async (token: string) => ({ sub: token })),
}));

describe('ClerkService', () => {
	it('verifies token using secret', async () => {
		const svc = new ClerkService('secret');
		const res = await svc.verifyToken('tok');
		expect(res).toMatchObject({ sub: 'tok' });
	});
});

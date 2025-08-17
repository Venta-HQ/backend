import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service';

vi.mock('@prisma/client', async (orig) => {
	const mod: any = await orig();
	class MockClient {
		$extends() {
			return this;
		}
		$connect = vi.fn(async () => {});
		$disconnect = vi.fn(async () => {});
	}
	return { ...mod, PrismaClient: MockClient, Prisma: { defineExtension: (x: any) => x } };
});

describe('PrismaService', () => {
	it('connects and disconnects on module hooks', async () => {
		const svc = new PrismaService('postgres://example', '', {
			setContext: vi.fn(),
			log: vi.fn(),
			error: vi.fn(),
		} as any);
		await svc.onModuleInit();
		await svc.onModuleDestroy();
		expect(svc.db).toBeDefined();
	});
});

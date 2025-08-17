import { describe, expect, it } from 'vitest';
import { Metadata } from '@grpc/grpc-js';
import { ExecutionContext } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { GrpcAuthGuard } from './grpc.guard';

describe('GrpcAuthGuard', () => {
	it('allows when metadata has user and clerk id', async () => {
		const guard = new GrpcAuthGuard(new Logger());
		const md = new Metadata();
		md.set('x-user-id', 'u1');
		md.set('x-clerk-id', 'c1');
		const ctx = { switchToRpc: () => ({ getContext: () => md }) } as unknown as ExecutionContext;
		await expect(guard.canActivate(ctx)).resolves.toBe(true);
	});

	it('rejects when missing metadata', async () => {
		const guard = new GrpcAuthGuard(new Logger());
		const md = new Metadata();
		const ctx = { switchToRpc: () => ({ getContext: () => md }) } as unknown as ExecutionContext;
		await expect(guard.canActivate(ctx)).rejects.toThrow();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { NatsQueueService } from './nats-queue.service';

describe('NatsQueueService', () => {
	it('subscribeToMultipleQueues delegates to subscribeToQueue', () => {
		const svc = new (NatsQueueService as any)(
			{ get: vi.fn() },
			{ setContext: vi.fn(), log: vi.fn(), error: vi.fn() },
			{ run: (fn: any) => fn(), getRequestId: vi.fn() },
		);
		svc.nc = {
			subscribe: vi.fn(() => ({ [Symbol.asyncIterator]: async function* () {} }) as any),
			publish: vi.fn(),
			close: vi.fn(),
			closed: vi.fn().mockReturnValue(false),
		};
		const spy = vi.spyOn(svc, 'subscribeToQueue');
		svc.subscribeToMultipleQueues([{ subject: 's1', handler: vi.fn() }], 'q');
		expect(spy).toHaveBeenCalledWith('s1', 'q', expect.any(Function));
	});
});

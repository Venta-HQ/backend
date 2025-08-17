import { describe, expect, it, vi } from 'vitest';
import { ClientProxy } from '@nestjs/microservices';
import { Logger } from '../../core/logger/logger.service';
import { EventService } from './typed-event.service';

describe('EventService', () => {
	it('validates against schema and emits with context/meta', async () => {
		const nats: Partial<ClientProxy> = { emit: vi.fn().mockResolvedValue(undefined) };
		const logger = new Logger();
		const svc = new EventService(
			nats as any,
			logger as any,
			{ getRequestId: () => 'rid' } as any,
			{ get: () => 'app' } as any,
		);

		const subject = 'marketplace.vendor.onboarded' as any;
		const payload = { vendorId: 'v1', ownerId: 'u1' } as any;
		await svc.emit(subject, payload);
		expect(nats.emit as any).toHaveBeenCalledWith(
			subject,
			expect.objectContaining({
				data: expect.objectContaining(payload),
				context: expect.objectContaining({ vendorId: 'v1', ownerId: 'u1', requestId: 'rid' }),
				meta: expect.objectContaining({
					correlationId: 'rid',
					domain: 'marketplace',
					subdomain: 'vendor',
					source: 'app',
					version: '1.0',
				}),
			}),
		);
	});

	it('throws on invalid payload per schema and does not emit', async () => {
		const nats: Partial<ClientProxy> = { emit: vi.fn().mockResolvedValue(undefined) };
		const logger = new Logger();
		const svc = new EventService(
			nats as any,
			logger as any,
			{ getRequestId: () => 'rid' } as any,
			{ get: () => 'app' } as any,
		);

		const subject = 'marketplace.vendor.onboarded' as any;
		await expect(svc.emit(subject, { foo: 'bar' } as any)).rejects.toBeDefined();
		expect(nats.emit as any).not.toHaveBeenCalled();
	});
});

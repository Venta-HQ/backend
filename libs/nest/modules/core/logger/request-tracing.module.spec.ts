import { describe, expect, it } from 'vitest';
import { RequestTracingModule } from './request-tracing.module';

describe('RequestTracingModule', () => {
	it('registers HTTP interceptor', () => {
		const mod = RequestTracingModule.register({ protocol: 'http' });
		expect(mod.providers?.length).toBe(1);
	});

	it('registers gRPC interceptor', () => {
		const mod = RequestTracingModule.register({ protocol: 'grpc' });
		expect(mod.providers?.length).toBe(1);
	});

	it('registers NATS interceptor', () => {
		const mod = RequestTracingModule.register({ protocol: 'nats' });
		expect(mod.providers?.length).toBe(1);
	});

	it('registers WebSocket interceptor', () => {
		const mod = RequestTracingModule.register({ protocol: 'websocket' });
		expect(mod.providers?.length).toBe(1);
	});
});

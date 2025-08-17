import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TracingModule } from './tracing.module';

describe('TracingModule', () => {
	let exitSpy: any;
	beforeAll(() => {
		// Avoid process.exit calls via signal handlers during tests
		exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
	});
	afterAll(() => exitSpy.mockRestore());

	it('register() defines OTEL init provider and starts SDK', async () => {
		vi.doMock('@opentelemetry/sdk-node', () => ({
			NodeSDK: vi.fn().mockImplementation(() => ({ start: vi.fn(async () => {}), shutdown: vi.fn(async () => {}) })),
		}));
		vi.doMock('@opentelemetry/exporter-trace-otlp-http', () => ({ OTLPTraceExporter: vi.fn() }));
		vi.doMock('@opentelemetry/sdk-trace-node', () => ({ BatchSpanProcessor: vi.fn() }));
		vi.doMock('@prisma/instrumentation', () => ({ PrismaInstrumentation: vi.fn() }));
		vi.doMock('@opentelemetry/instrumentation-http', () => ({ HttpInstrumentation: vi.fn() }));
		vi.doMock('@opentelemetry/instrumentation-express', () => ({ ExpressInstrumentation: vi.fn() }));
		vi.doMock('@opentelemetry/instrumentation-grpc', () => ({ GrpcInstrumentation: vi.fn() }));
		vi.doMock('@opentelemetry/instrumentation-ioredis', () => ({ IORedisInstrumentation: vi.fn() }));
		vi.doMock('@opentelemetry/instrumentation-socket.io', () => ({ SocketIoInstrumentation: vi.fn() }));

		const mod = TracingModule.register();
		expect(mod.providers?.length).toBeGreaterThan(0);
	});
});

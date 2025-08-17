import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BootstrapService } from './bootstrap.service';

vi.mock('@nestjs/core', async (importOriginal) => {
	const actual: any = await importOriginal();
	return {
		...actual,
		NestFactory: {
			create: vi.fn(async () => ({
				get: () => ({ get: () => undefined }),
				resolve: vi.fn(async () => ({ useLogger: vi.fn() })),
				useLogger: vi.fn(),
				enableCors: vi.fn(),
				listen: vi.fn(async () => {}),
				close: vi.fn(async () => {}),
			})),
			createMicroservice: vi.fn(async () => ({
				resolve: vi.fn(async () => ({ useLogger: vi.fn() })),
				useLogger: vi.fn(),
				listen: vi.fn(async () => {}),
				close: vi.fn(async () => {}),
			})),
		},
	};
});

describe('BootstrapService', () => {
	let exitSpy: any;
	beforeAll(() => {
		exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
	});

	afterAll(() => {
		exitSpy.mockRestore();
	});

	afterEach(() => {
		process.removeAllListeners('SIGINT');
		process.removeAllListeners('SIGTERM');
	});

	it('createHttpApp returns app with host/port defaults', async () => {
		const { app, host, port } = await BootstrapService.createHttpApp({ module: {} as any });
		expect(app).toBeDefined();
		expect(host).toBe('0.0.0.0');
		expect(port).toBe(3000);
	});

	it('createGrpcApp creates a microservice', async () => {
		const { app } = await BootstrapService.createGrpcApp({
			module: {} as any,
			package: 'pkg',
			protoPath: 'shared/index.proto',
			url: 'localhost:5000',
		});
		expect(app).toBeDefined();
	});

	it('setupGracefulShutdown closes apps on signal', async () => {
		const close = vi.fn(async () => {});
		const app = { close } as any;
		const kill = process.emit.bind(process);
		// @ts-ignore
		BootstrapService['setupGracefulShutdown']([app]);
		// Emit signal
		kill('SIGINT');
		expect(close).toHaveBeenCalled();
	});
});

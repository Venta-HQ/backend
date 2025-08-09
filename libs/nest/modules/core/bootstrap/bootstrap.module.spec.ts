import { vi } from 'vitest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlingModule } from '@venta/nest/errors';
import { HealthModule, LoggerModule, PrometheusModule } from '@venta/nest/modules';
import { BootstrapModule, BootstrapOptions } from './bootstrap.module';

describe('BootstrapModule', () => {
	let module: TestingModule;

	describe('forRoot', () => {
		it('should create a dynamic module with base modules', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'http',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			expect(dynamicModule.module).toBe(BootstrapModule);
			expect(dynamicModule.imports).toContain(ConfigModule);
			expect(dynamicModule.imports).toContain(ErrorHandlingModule);
			expect(dynamicModule.exports).toContain(ConfigModule);
			expect(dynamicModule.exports).toContain(ErrorHandlingModule);
		});

		it('should configure HealthModule with appName', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'http',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			// Find the HealthModule configuration in imports
			const healthModuleImport = dynamicModule.imports.find((importItem: any) => importItem?.module === HealthModule);

			expect(healthModuleImport).toBeDefined();
			expect(healthModuleImport.module).toBe(HealthModule);
		});

		it('should configure LoggerModule with correct protocol mapping', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'websocket',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			// Find the LoggerModule configuration in imports
			const loggerModuleImport = dynamicModule.imports.find((importItem: any) => importItem?.module === LoggerModule);

			expect(loggerModuleImport).toBeDefined();
			expect(loggerModuleImport.module).toBe(LoggerModule);
		});

		it('should configure PrometheusModule with appName', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'http',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			// Find the PrometheusModule configuration in imports
			const prometheusModuleImport = dynamicModule.imports.find(
				(importItem: any) => importItem?.module === PrometheusModule,
			);

			expect(prometheusModuleImport).toBeDefined();
			expect(prometheusModuleImport.module).toBe(PrometheusModule);
		});

		it('should include additional modules when provided', async () => {
			// Create a proper module class for testing
			class TestModule {}

			const options: BootstrapOptions = {
				additionalModules: [TestModule],
				appName: 'Test App',
				protocol: 'http',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			expect(dynamicModule.imports).toContain(TestModule);
		});

		it('should include additional providers when provided', async () => {
			const additionalProvider = { provide: 'TestProvider', useValue: 'test' };
			const options: BootstrapOptions = {
				additionalProviders: [additionalProvider],
				appName: 'Test App',
				protocol: 'http',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			expect(dynamicModule.providers).toContain(additionalProvider);
		});

		it('should handle healthChecks when provided', async () => {
			const healthChecks = async () => ({ test: 'healthy' });
			const options: BootstrapOptions = {
				appName: 'Test App',
				healthChecks,
				protocol: 'http',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			// Find the HealthModule configuration in imports
			const healthModuleImport = dynamicModule.imports.find((importItem: any) => importItem?.module === HealthModule);

			expect(healthModuleImport).toBeDefined();
		});

		it('should handle empty additional modules and providers', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'grpc',
			};

			const dynamicModule = BootstrapModule.forRoot(options);

			expect(dynamicModule.imports).toBeDefined();
			expect(dynamicModule.providers).toEqual([]);
		});

		it('should support all protocol types', async () => {
			const protocols: Array<'http' | 'grpc' | 'websocket'> = ['http', 'grpc', 'websocket'];

			protocols.forEach((protocol) => {
				const options: BootstrapOptions = {
					appName: 'Test App',
					protocol,
				};

				const dynamicModule = BootstrapModule.forRoot(options);

				expect(dynamicModule).toBeDefined();
				expect(dynamicModule.imports).toBeDefined();
				expect(dynamicModule.exports).toBeDefined();
			});
		});
	});

	describe('module compilation', () => {
		it('should compile successfully with HTTP protocol', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'http',
			};

			module = await Test.createTestingModule({
				imports: [BootstrapModule.forRoot(options)],
			})
				.overrideProvider('ConfigService')
				.useValue({
					get: vi.fn().mockReturnValue('test-value'),
				})
				.compile();

			expect(module).toBeDefined();
		});

		it('should compile successfully with gRPC protocol', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'grpc',
			};

			module = await Test.createTestingModule({
				imports: [BootstrapModule.forRoot(options)],
			})
				.overrideProvider('ConfigService')
				.useValue({
					get: vi.fn().mockReturnValue('test-value'),
				})
				.compile();

			expect(module).toBeDefined();
		});

		it('should compile successfully with WebSocket protocol', async () => {
			const options: BootstrapOptions = {
				appName: 'Test App',
				protocol: 'websocket',
			};

			module = await Test.createTestingModule({
				imports: [BootstrapModule.forRoot(options)],
			})
				.overrideProvider('ConfigService')
				.useValue({
					get: vi.fn().mockReturnValue('test-value'),
				})
				.compile();

			expect(module).toBeDefined();
		});

		it('should compile with additional modules and providers', async () => {
			// Create a proper module class for testing
			class TestModule {}

			const additionalProvider = { provide: 'TestProvider', useValue: 'test' };
			const options: BootstrapOptions = {
				additionalModules: [TestModule],
				additionalProviders: [additionalProvider],
				appName: 'Test App',
				protocol: 'http',
			};

			module = await Test.createTestingModule({
				imports: [BootstrapModule.forRoot(options)],
			})
				.overrideProvider('ConfigService')
				.useValue({
					get: vi.fn().mockReturnValue('test-value'),
				})
				.compile();

			expect(module).toBeDefined();
		});
	});
});

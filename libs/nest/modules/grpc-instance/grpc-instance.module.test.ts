import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { GrpcInstanceModule } from './grpc-instance.module';

describe('GrpcInstanceModule', () => {
	let mockConfigService: any;

	beforeEach(() => {
		mockConfigService = {
			get: () => {},
		};
	});

	describe('register', () => {
		const testConfig = {
			protoPackage: 'test.package',
			protoPath: '/path/to/proto',
			provide: 'TEST_SERVICE',
			serviceName: 'TestService',
			urlEnvVar: 'TEST_SERVICE_URL',
		};

		it('should return a dynamic module with correct configuration', () => {
			const module = GrpcInstanceModule.register(testConfig);

			expect(module).toEqual({
				exports: [testConfig.provide],
				global: true,
				imports: [expect.any(Object)], // ClientsModule.registerAsync result
				module: GrpcInstanceModule,
				providers: [
					{
						inject: ['REQUEST', `${testConfig.serviceName}-client`],
						provide: testConfig.provide,
						scope: expect.any(Number), // Scope.REQUEST
						useFactory: expect.any(Function),
					},
				],
			});
		});

		it('should be a global module', () => {
			const module = GrpcInstanceModule.register(testConfig);

			expect(module.global).toBe(true);
		});

		it('should export the provided service name', () => {
			const module = GrpcInstanceModule.register(testConfig);

			expect(module.exports).toContain(testConfig.provide);
		});

		it('should have a provider with REQUEST scope', () => {
			const module = GrpcInstanceModule.register(testConfig);

			expect(module.providers).toHaveLength(1);
			expect(module.providers[0].scope).toBeDefined();
		});

		it('should inject REQUEST and client', () => {
			const module = GrpcInstanceModule.register(testConfig);

			expect(module.providers[0].inject).toHaveLength(2);
			expect(module.providers[0].inject[1]).toBe(`${testConfig.serviceName}-client`);
		});
	});

	describe('module structure', () => {
		it('should import ClientsModule.registerAsync', () => {
			const testConfig = {
				protoPackage: 'test.package',
				protoPath: '/path/to/proto',
				provide: 'TEST_SERVICE',
				serviceName: 'TestService',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(testConfig);

			expect(module.imports).toHaveLength(1);
			expect(module.imports[0]).toBeDefined();
		});

		it('should have correct module reference', () => {
			const testConfig = {
				protoPackage: 'test.package',
				protoPath: '/path/to/proto',
				provide: 'TEST_SERVICE',
				serviceName: 'TestService',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(testConfig);

			expect(module.module).toBe(GrpcInstanceModule);
		});

		it('should have exactly one provider', () => {
			const testConfig = {
				protoPackage: 'test.package',
				protoPath: '/path/to/proto',
				provide: 'TEST_SERVICE',
				serviceName: 'TestService',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(testConfig);

			expect(module.providers).toHaveLength(1);
		});

		it('should have exactly one export', () => {
			const testConfig = {
				protoPackage: 'test.package',
				protoPath: '/path/to/proto',
				provide: 'TEST_SERVICE',
				serviceName: 'TestService',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(testConfig);

			expect(module.exports).toHaveLength(1);
		});
	});

	describe('different configurations', () => {
		it('should handle different service names', () => {
			const configs = [
				{
					protoPackage: 'user.package',
					protoPath: '/path/to/user.proto',
					provide: 'USER_SERVICE',
					serviceName: 'UserService',
					urlEnvVar: 'USER_SERVICE_URL',
				},
				{
					protoPackage: 'vendor.package',
					protoPath: '/path/to/vendor.proto',
					provide: 'VENDOR_SERVICE',
					serviceName: 'VendorService',
					urlEnvVar: 'VENDOR_SERVICE_URL',
				},
			];

			configs.forEach((config) => {
				const module = GrpcInstanceModule.register(config);

				expect(module.exports).toContain(config.provide);
				expect(module.providers[0].inject[1]).toBe(`${config.serviceName}-client`);
			});
		});

		it('should handle different proto packages and paths', () => {
			const config = {
				protoPackage: 'custom.package',
				protoPath: '/custom/path/to/proto',
				provide: 'CUSTOM_SERVICE',
				serviceName: 'CustomService',
				urlEnvVar: 'CUSTOM_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(config);

			expect(module.exports).toContain(config.provide);
			expect(module.providers[0].inject[1]).toBe(`${config.serviceName}-client`);
		});
	});

	describe('edge cases', () => {
		it('should handle empty service name', () => {
			const config = {
				protoPackage: 'test.package',
				protoPath: '/path/to/proto',
				provide: 'TEST_SERVICE',
				serviceName: '',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(config);

			expect(module.providers[0].inject[1]).toBe('-client');
		});

		it('should handle empty provide name', () => {
			const config = {
				protoPackage: 'test.package',
				protoPath: '/path/to/proto',
				provide: '',
				serviceName: 'TestService',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(config);

			expect(module.exports).toContain('');
		});

		it('should handle empty proto package', () => {
			const config = {
				protoPackage: '',
				protoPath: '/path/to/proto',
				provide: 'TEST_SERVICE',
				serviceName: 'TestService',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(config);

			expect(module.exports).toContain(config.provide);
		});

		it('should handle empty proto path', () => {
			const config = {
				protoPackage: 'test.package',
				protoPath: '',
				provide: 'TEST_SERVICE',
				serviceName: 'TestService',
				urlEnvVar: 'TEST_SERVICE_URL',
			};

			const module = GrpcInstanceModule.register(config);

			expect(module.exports).toContain(config.provide);
		});

		it('should handle empty URL environment variable', () => {
			const config = {
				protoPackage: 'test.package',
				protoPath: '/path/to/proto',
				provide: 'TEST_SERVICE',
				serviceName: 'TestService',
				urlEnvVar: '',
			};

			const module = GrpcInstanceModule.register(config);

			expect(module.exports).toContain(config.provide);
		});
	});

	describe('useFactory function', () => {
		const testConfig = {
			protoPackage: 'test.package',
			protoPath: '/path/to/proto',
			provide: 'TEST_SERVICE',
			serviceName: 'TestService',
			urlEnvVar: 'TEST_SERVICE_URL',
		};

		it('should have a useFactory function', () => {
			const module = GrpcInstanceModule.register(testConfig);

			expect(module.providers[0].useFactory).toBeDefined();
			expect(typeof module.providers[0].useFactory).toBe('function');
		});

		it('should have correct inject array', () => {
			const module = GrpcInstanceModule.register(testConfig);

			expect(module.providers[0].inject).toHaveLength(2);
			expect(module.providers[0].inject[1]).toBe(`${testConfig.serviceName}-client`);
		});
	});
});

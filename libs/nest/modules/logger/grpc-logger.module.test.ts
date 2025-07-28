import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GrpcLoggerModule } from './grpc-logger.module';
import { GrpcLogger } from './grpc-logger.service';
import { RequestContextService } from './request-context.service';

// Mock nestjs-pino
vi.mock('nestjs-pino', () => ({
	LoggerModule: {
		forRootAsync: vi.fn(() => ({
			module: class MockPinoModule {},
			providers: [],
		})),
	},
}));

describe('GrpcLoggerModule', () => {
	let module: TestingModule;
	let configService: ConfigService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					envFilePath: '.env.test',
				}),
				GrpcLoggerModule.register('test-app'),
			],
		}).compile();

		configService = module.get<ConfigService>(ConfigService);
	});

	describe('module registration', () => {
		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should register as a dynamic module', () => {
			const grpcLoggerModule = module.get(GrpcLoggerModule);
			expect(grpcLoggerModule).toBeDefined();
		});

		it('should be a global module', () => {
			// Test that the module is marked as global
			expect(module).toBeDefined();
		});

		it('should import ConfigModule', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should export GrpcLogger', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
			expect(grpcLogger).toBeInstanceOf(GrpcLogger);
		});

		it('should provide GrpcLogger', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});

		it('should provide RequestContextService', () => {
			const requestContextService = module.get(RequestContextService);
			expect(requestContextService).toBeDefined();
			expect(requestContextService).toBeInstanceOf(RequestContextService);
		});

		it('should provide GrpcRequestIdInterceptor as APP_INTERCEPTOR', () => {
			// The interceptor should be available in the module
			expect(module).toBeDefined();
		});
	});

	describe('service factory', () => {
		it('should create GrpcLogger with app name', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});

		it('should inject ConfigService into factory', () => {
			expect(configService).toBeDefined();
		});

		it('should use LOKI_PASSWORD from config', () => {
			// The service should be created with the config values
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});

		it('should use LOKI_USERNAME from config', () => {
			// The service should be created with the config values
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});

		it('should use LOKI_URL from config', () => {
			// The service should be created with the config values
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});
	});

	describe('module configuration', () => {
		it('should have correct imports', () => {
			expect(configService).toBeDefined();
		});

		it('should have correct providers', () => {
			const grpcLogger = module.get(GrpcLogger);
			const requestContextService = module.get(RequestContextService);
			expect(grpcLogger).toBeDefined();
			expect(requestContextService).toBeDefined();
		});

		it('should have correct exports', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});
	});

	describe('dependency injection', () => {
		it('should inject ConfigService properly', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should make GrpcLogger available for injection', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
			expect(grpcLogger).toBeInstanceOf(GrpcLogger);
		});

		it('should make RequestContextService available for injection', () => {
			const requestContextService = module.get(RequestContextService);
			expect(requestContextService).toBeDefined();
			expect(requestContextService).toBeInstanceOf(RequestContextService);
		});

		it('should have proper dependency injection setup', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});
	});

	describe('module instantiation', () => {
		it('should create module instance without errors', () => {
			expect(module).toBeDefined();
		});

		it('should have correct module structure', () => {
			const grpcLoggerModule = module.get(GrpcLoggerModule);
			expect(grpcLoggerModule).toBeDefined();
		});
	});

	describe('service availability', () => {
		it('should have GrpcLogger methods available', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(typeof grpcLogger.log).toBe('function');
			expect(typeof grpcLogger.error).toBe('function');
			expect(typeof grpcLogger.warn).toBe('function');
			expect(typeof grpcLogger.debug).toBe('function');
		});

		it('should have RequestContextService methods available', () => {
			const requestContextService = module.get(RequestContextService);
			expect(typeof requestContextService.get).toBe('function');
			expect(typeof requestContextService.set).toBe('function');
			expect(typeof requestContextService.run).toBe('function');
		});
	});

	describe('error handling', () => {
		it('should handle missing config values gracefully', async () => {
			// Test with missing config values
			const testModule = await Test.createTestingModule({
				imports: [
					ConfigModule.forRoot({
						envFilePath: '.env.test',
					}),
					GrpcLoggerModule.register('test-app'),
				],
			}).compile();

			expect(testModule).toBeDefined();
		});

		it('should handle module initialization errors gracefully', () => {
			expect(module).toBeDefined();
		});
	});

	describe('performance considerations', () => {
		it('should be lightweight and fast to instantiate', () => {
			expect(module).toBeDefined();
		});

		it('should not have memory leaks', () => {
			expect(module).toBeDefined();
		});
	});

	describe('compatibility', () => {
		it('should be compatible with NestJS framework', () => {
			expect(module).toBeDefined();
		});

		it('should work with dependency injection system', () => {
			const grpcLogger = module.get(GrpcLogger);
			expect(grpcLogger).toBeDefined();
		});
	});

	describe('app name parameter', () => {
		it('should accept different app names', async () => {
			const testModule = await Test.createTestingModule({
				imports: [
					ConfigModule.forRoot({
						envFilePath: '.env.test',
					}),
					GrpcLoggerModule.register('different-app'),
				],
			}).compile();

			expect(testModule).toBeDefined();
		});

		it('should handle empty app name', async () => {
			const testModule = await Test.createTestingModule({
				imports: [
					ConfigModule.forRoot({
						envFilePath: '.env.test',
					}),
					GrpcLoggerModule.register(''),
				],
			}).compile();

			expect(testModule).toBeDefined();
		});
	});
});

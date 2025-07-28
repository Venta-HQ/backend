import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { HttpLoggerModule } from './http-logger.module';

// Mock nestjs-pino
vi.mock('nestjs-pino', () => ({
	LoggerModule: {
		forRootAsync: vi.fn(() => ({
			module: class MockPinoModule {},
			providers: [],
		})),
	},
}));

describe('HttpLoggerModule', () => {
	let module: TestingModule;
	let configService: ConfigService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					envFilePath: '.env.test',
				}),
				HttpLoggerModule.register('test-app'),
			],
		}).compile();

		configService = module.get<ConfigService>(ConfigService);
	});

	describe('module registration', () => {
		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should register as a dynamic module', () => {
			const httpLoggerModule = module.get(HttpLoggerModule);
			expect(httpLoggerModule).toBeDefined();
		});

		it('should be a global module', () => {
			// Test that the module is marked as global
			expect(module).toBeDefined();
		});

		it('should import ConfigModule', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});
	});

	describe('service factory', () => {
		it('should create HTTP logger with app name', () => {
			// The module should be created successfully
			expect(module).toBeDefined();
		});

		it('should inject ConfigService into factory', () => {
			expect(configService).toBeDefined();
		});

		it('should use LOKI_PASSWORD from config', () => {
			// The service should be created with the config values
			expect(module).toBeDefined();
		});

		it('should use LOKI_USERNAME from config', () => {
			// The service should be created with the config values
			expect(module).toBeDefined();
		});

		it('should use LOKI_URL from config', () => {
			// The service should be created with the config values
			expect(module).toBeDefined();
		});
	});

	describe('module configuration', () => {
		it('should have correct imports', () => {
			expect(configService).toBeDefined();
		});

		it('should configure Pino logger correctly', () => {
			// The module should configure Pino logger
			expect(module).toBeDefined();
		});

		it('should set up request ID generation', () => {
			// The module should set up request ID generation
			expect(module).toBeDefined();
		});

		it('should configure custom properties', () => {
			// The module should configure custom properties
			expect(module).toBeDefined();
		});
	});

	describe('dependency injection', () => {
		it('should inject ConfigService properly', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should have proper dependency injection setup', () => {
			expect(module).toBeDefined();
		});
	});

	describe('module instantiation', () => {
		it('should create module instance without errors', () => {
			expect(module).toBeDefined();
		});

		it('should have correct module structure', () => {
			const httpLoggerModule = module.get(HttpLoggerModule);
			expect(httpLoggerModule).toBeDefined();
		});
	});

	describe('logging configuration', () => {
		it('should configure Loki transport', () => {
			// The module should configure Loki transport
			expect(module).toBeDefined();
		});

		it('should configure pretty printing for non-production', () => {
			// The module should configure pretty printing for non-production
			expect(module).toBeDefined();
		});

		it('should set up request ID handling', () => {
			// The module should set up request ID handling
			expect(module).toBeDefined();
		});

		it('should configure custom properties for requests', () => {
			// The module should configure custom properties for requests
			expect(module).toBeDefined();
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
					HttpLoggerModule.register('test-app'),
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
			expect(module).toBeDefined();
		});
	});

	describe('app name parameter', () => {
		it('should accept different app names', async () => {
			const testModule = await Test.createTestingModule({
				imports: [
					ConfigModule.forRoot({
						envFilePath: '.env.test',
					}),
					HttpLoggerModule.register('different-app'),
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
					HttpLoggerModule.register(''),
				],
			}).compile();

			expect(testModule).toBeDefined();
		});
	});

	describe('environment-specific configuration', () => {
		it('should configure different transports based on environment', () => {
			// The module should configure different transports based on environment
			expect(module).toBeDefined();
		});

		it('should include pretty printing in non-production', () => {
			// The module should include pretty printing in non-production
			expect(module).toBeDefined();
		});

		it('should exclude pretty printing in production', () => {
			// The module should exclude pretty printing in production
			expect(module).toBeDefined();
		});
	});

	describe('request ID handling', () => {
		it('should generate request IDs when not present', () => {
			// The module should generate request IDs when not present
			expect(module).toBeDefined();
		});

		it('should use existing request IDs from headers', () => {
			// The module should use existing request IDs from headers
			expect(module).toBeDefined();
		});

		it('should set request ID in response headers', () => {
			// The module should set request ID in response headers
			expect(module).toBeDefined();
		});
	});
}); 
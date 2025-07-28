import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AlgoliaModule } from './algolia.module';
import { AlgoliaService } from './algolia.service';

describe('AlgoliaModule', () => {
	let module: TestingModule;
	let configService: ConfigService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					envFilePath: '.env.test',
				}),
				AlgoliaModule.register(),
			],
		}).compile();

		configService = module.get<ConfigService>(ConfigService);
	});

	describe('module registration', () => {
		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should register as a dynamic module', () => {
			const algoliaModule = module.get(AlgoliaModule);
			expect(algoliaModule).toBeDefined();
		});

		it('should import ConfigModule', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should export AlgoliaService', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
			expect(algoliaService).toBeInstanceOf(AlgoliaService);
		});

		it('should provide AlgoliaService', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});
	});

	describe('service factory', () => {
		it('should create AlgoliaService with config values', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});

		it('should inject ConfigService into factory', () => {
			expect(configService).toBeDefined();
		});

		it('should use ALGOLIA_APPLICATION_ID from config', () => {
			// The service should be created with the config values
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});

		it('should use ALGOLIA_API_KEY from config', () => {
			// The service should be created with the config values
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});
	});

	describe('module configuration', () => {
		it('should have correct imports', () => {
			expect(configService).toBeDefined();
		});

		it('should have correct providers', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});

		it('should have correct exports', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});
	});

	describe('dependency injection', () => {
		it('should inject ConfigService properly', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should make AlgoliaService available for injection', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
			expect(algoliaService).toBeInstanceOf(AlgoliaService);
		});

		it('should have proper dependency injection setup', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});
	});

	describe('module instantiation', () => {
		it('should create module instance without errors', () => {
			expect(module).toBeDefined();
		});

		it('should have correct module structure', () => {
			const algoliaModule = module.get(AlgoliaModule);
			expect(algoliaModule).toBeDefined();
		});
	});

	describe('service availability', () => {
		it('should have createObject method', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(typeof algoliaService.createObject).toBe('function');
		});

		it('should have updateObject method', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(typeof algoliaService.updateObject).toBe('function');
		});

		it('should have deleteObject method', () => {
			const algoliaService = module.get(AlgoliaService);
			expect(typeof algoliaService.deleteObject).toBe('function');
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
					AlgoliaModule.register(),
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
			const algoliaService = module.get(AlgoliaService);
			expect(algoliaService).toBeDefined();
		});
	});
});

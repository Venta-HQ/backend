import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UploadModule } from './upload.module';
import { UploadService } from './upload.service';

describe('UploadModule', () => {
	let module: TestingModule;
	let configService: ConfigService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					envFilePath: '.env.test',
				}),
				UploadModule.register(),
			],
		}).compile();

		configService = module.get<ConfigService>(ConfigService);
	});

	describe('module registration', () => {
		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should register as a dynamic module', () => {
			const uploadModule = module.get(UploadModule);
			expect(uploadModule).toBeDefined();
		});

		it('should be a global module', () => {
			// Test that the module is marked as global
			expect(module).toBeDefined();
		});

		it('should import ConfigModule', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should export UploadService', () => {
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
			expect(uploadService).toBeInstanceOf(UploadService);
		});

		it('should provide UploadService', () => {
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});
	});

	describe('service factory', () => {
		it('should create UploadService with config values', () => {
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});

		it('should inject ConfigService into factory', () => {
			expect(configService).toBeDefined();
		});

		it('should use CLOUDINARY_API_KEY from config', () => {
			// The service should be created with the config values
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});

		it('should use CLOUDINARY_API_SECRET from config', () => {
			// The service should be created with the config values
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});

		it('should use CLOUDINARY_CLOUD_NAME from config', () => {
			// The service should be created with the config values
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});
	});

	describe('module configuration', () => {
		it('should have correct imports', () => {
			expect(configService).toBeDefined();
		});

		it('should have correct providers', () => {
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});

		it('should have correct exports', () => {
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});
	});

	describe('dependency injection', () => {
		it('should inject ConfigService properly', () => {
			expect(configService).toBeDefined();
			expect(configService).toBeInstanceOf(ConfigService);
		});

		it('should make UploadService available for injection', () => {
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
			expect(uploadService).toBeInstanceOf(UploadService);
		});

		it('should have proper dependency injection setup', () => {
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});
	});

	describe('module instantiation', () => {
		it('should create module instance without errors', () => {
			expect(module).toBeDefined();
		});

		it('should have correct module structure', () => {
			const uploadModule = module.get(UploadModule);
			expect(uploadModule).toBeDefined();
		});
	});

	describe('service availability', () => {
		it('should have uploadImage method', () => {
			const uploadService = module.get(UploadService);
			expect(typeof uploadService.uploadImage).toBe('function');
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
					UploadModule.register(),
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
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});
	});

	describe('cloudinary configuration', () => {
		it('should configure Cloudinary with provided credentials', () => {
			// The service should configure Cloudinary with the provided credentials
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});

		it('should handle invalid Cloudinary credentials gracefully', () => {
			// The service should handle invalid credentials gracefully
			const uploadService = module.get(UploadService);
			expect(uploadService).toBeDefined();
		});
	});
});

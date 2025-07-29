import { beforeEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { LoggerModule } from './logger.module';
import { Logger } from './logger.service';
import { RequestContextService } from './request-context.service';

describe('LoggerModule', () => {
	describe('HTTP Protocol', () => {
		let module: any;

		beforeEach(async () => {
			module = await Test.createTestingModule({
				imports: [LoggerModule.register({ appName: 'TestApp', protocol: 'http' })],
			}).compile();
		});

		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should export Logger as unified logger for HTTP protocol', () => {
			const logger = module.get(Logger);
			expect(logger).toBeDefined();
		});

		it('should provide RequestContextService', () => {
			const requestContextService = module.get(RequestContextService);
			expect(requestContextService).toBeDefined();
		});
	});

	describe('gRPC Protocol', () => {
		let module: any;

		beforeEach(async () => {
			module = await Test.createTestingModule({
				imports: [LoggerModule.register({ appName: 'TestApp', protocol: 'grpc' })],
			}).compile();
		});

		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should export Logger as unified logger for gRPC protocol', () => {
			const logger = module.get(Logger);
			expect(logger).toBeDefined();
		});

		it('should provide RequestContextService', () => {
			const requestContextService = module.get(RequestContextService);
			expect(requestContextService).toBeDefined();
		});
	});

	describe('Auto Protocol Detection', () => {
		let module: any;

		beforeEach(async () => {
			module = await Test.createTestingModule({
				imports: [LoggerModule.register({ appName: 'TestApp', protocol: 'auto' })],
			}).compile();
		});

		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should export Logger as unified logger for auto protocol (defaults to gRPC)', () => {
			const logger = module.get(Logger);
			expect(logger).toBeDefined();
		});

		it('should provide RequestContextService', () => {
			const requestContextService = module.get(RequestContextService);
			expect(requestContextService).toBeDefined();
		});
	});

	describe('String-based Registration', () => {
		let module: any;

		beforeEach(async () => {
			module = await Test.createTestingModule({
				imports: [LoggerModule.register('TestApp')],
			}).compile();
		});

		it('should be defined', () => {
			expect(module).toBeDefined();
		});

		it('should export Logger as unified logger for string-based registration (defaults to auto)', () => {
			const logger = module.get(Logger);
			expect(logger).toBeDefined();
		});
	});

	describe('Configuration', () => {
		it('should handle missing Loki configuration gracefully', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';
			delete process.env.LOKI_URL;
			delete process.env.LOKI_USERNAME;
			delete process.env.LOKI_PASSWORD;

			const module = await Test.createTestingModule({
				imports: [LoggerModule.register({ appName: 'TestApp', protocol: 'http' })],
			}).compile();

			expect(module).toBeDefined();
			expect(() => module.get(Logger)).not.toThrow();

			// Restore environment
			process.env.NODE_ENV = originalEnv;
		});

		it('should handle production environment', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const module = await Test.createTestingModule({
				imports: [LoggerModule.register({ appName: 'TestApp', protocol: 'http' })],
			}).compile();

			expect(module).toBeDefined();
			expect(() => module.get(Logger)).not.toThrow();

			// Restore environment
			process.env.NODE_ENV = originalEnv;
		});
	});
});

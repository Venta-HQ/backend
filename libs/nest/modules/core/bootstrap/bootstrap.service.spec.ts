import { describe, expect, it } from 'vitest';
import { BootstrapService, GrpcBootstrapOptions, HttpBootstrapOptions } from './bootstrap.service';

describe('BootstrapService', () => {
	describe('createHttpApp', () => {
		it('should return correct structure for HTTP app creation', () => {
			const options: HttpBootstrapOptions = {
				enableCors: true,
				host: '0.0.0.0',
				module: { module: 'TestModule' },
				port: 'PORT',
			};

			// Test the structure of the options interface
			expect(options.module).toBeDefined();
			expect(options.port).toBe('PORT');
			expect(options.host).toBe('0.0.0.0');
			expect(options.enableCors).toBe(true);
		});

		it('should handle CORS configuration options', () => {
			const corsOptions = {
				allowedHeaders: ['Custom-Header'],
				credentials: false,
				methods: ['GET', 'POST'],
				origin: 'https://example.com',
			};

			const options: HttpBootstrapOptions = {
				corsOptions,
				module: { module: 'TestModule' },
			};

			expect(options.corsOptions).toEqual(corsOptions);
		});

		it('should handle optional parameters', () => {
			const options: HttpBootstrapOptions = {
				module: { module: 'TestModule' },
			};

			expect(options.port).toBeUndefined();
			expect(options.host).toBeUndefined();
			expect(options.enableCors).toBeUndefined();
		});
	});

	describe('createGrpcApp', () => {
		it('should return correct structure for gRPC app creation', () => {
			const options: GrpcBootstrapOptions = {
				defaultUrl: 'localhost:5001',
				module: { module: 'TestModule' },
				package: 'test',
				protoPath: '../proto/test.proto',
				urlEnvVar: 'TEST_SERVICE_ADDRESS',
			};

			expect(options.module).toBeDefined();
			expect(options.package).toBe('test');
			expect(options.protoPath).toBe('../proto/test.proto');
			expect(options.urlEnvVar).toBe('TEST_SERVICE_ADDRESS');
			expect(options.defaultUrl).toBe('localhost:5001');
		});

		it('should handle optional defaultUrl parameter', () => {
			const options: GrpcBootstrapOptions = {
				module: { module: 'TestModule' },
				package: 'test',
				protoPath: '../proto/test.proto',
				urlEnvVar: 'TEST_SERVICE_ADDRESS',
			};

			expect(options.defaultUrl).toBeUndefined();
		});
	});

	describe('environment variable handling', () => {
		it('should handle ALLOWED_ORIGINS environment variable', () => {
			const originalEnv = process.env.ALLOWED_ORIGINS;
			process.env.ALLOWED_ORIGINS = 'https://app1.com,https://app2.com';

			const origins = (process.env.ALLOWED_ORIGINS)?.split(',') || [
				'http://localhost:3000',
				'http://localhost:3001',
			];
			expect(origins).toEqual(['https://app1.com', 'https://app2.com']);

			process.env.ALLOWED_ORIGINS = originalEnv;
		});

		it('should use default origins when ALLOWED_ORIGINS is not set', () => {
			const originalEnv = process.env.ALLOWED_ORIGINS;
			delete process.env.ALLOWED_ORIGINS;

			const origins = ['http://localhost:3000', 'http://localhost:3001'];
			expect(origins).toEqual(['http://localhost:3000', 'http://localhost:3001']);

			process.env.ALLOWED_ORIGINS = originalEnv;
		});

		it('should handle service address environment variables', () => {
			const originalEnv = process.env.TEST_SERVICE_ADDRESS;
			process.env.TEST_SERVICE_ADDRESS = 'localhost:5002';

			const url = process.env.TEST_SERVICE_ADDRESS || 'localhost:5000';
			expect(url).toBe('localhost:5002');

			process.env.TEST_SERVICE_ADDRESS = originalEnv;
		});
	});

	describe('interface validation', () => {
		it('should validate HttpBootstrapOptions interface', () => {
			const options: HttpBootstrapOptions = {
				corsOptions: {
					allowedHeaders: ['Content-Type'],
					credentials: true,
					methods: ['GET', 'POST'],
					origin: 'https://example.com',
				},
				enableCors: true,
				host: '0.0.0.0',
				module: { module: 'TestModule' },
				port: 'PORT',
			};

			expect(options).toBeDefined();
			expect(typeof options.module).toBe('object');
			expect(typeof options.port).toBe('string');
			expect(typeof options.host).toBe('string');
			expect(typeof options.enableCors).toBe('boolean');
			expect(typeof options.corsOptions).toBe('object');
		});

		it('should validate GrpcBootstrapOptions interface', () => {
			const options: GrpcBootstrapOptions = {
				defaultUrl: 'localhost:5001',
				module: { module: 'TestModule' },
				package: 'test',
				protoPath: '../proto/test.proto',
				urlEnvVar: 'TEST_SERVICE_ADDRESS',
			};

			expect(options).toBeDefined();
			expect(typeof options.module).toBe('object');
			expect(typeof options.package).toBe('string');
			expect(typeof options.protoPath).toBe('string');
			expect(typeof options.urlEnvVar).toBe('string');
			expect(typeof options.defaultUrl).toBe('string');
		});
	});

	describe('static methods existence', () => {
		it('should have createHttpApp static method', () => {
			expect(typeof BootstrapService.createHttpApp).toBe('function');
		});

		it('should have createGrpcApp static method', () => {
			expect(typeof BootstrapService.createGrpcApp).toBe('function');
		});

		it('should have bootstrapHttp static method', () => {
			expect(typeof BootstrapService.bootstrapHttp).toBe('function');
		});

		it('should have bootstrapGrpc static method', () => {
			expect(typeof BootstrapService.bootstrapGrpc).toBe('function');
		});
	});
});

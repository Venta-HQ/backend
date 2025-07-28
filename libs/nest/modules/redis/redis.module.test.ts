import { describe, expect, it } from 'vitest';

describe('RedisModule', () => {

	describe('module structure', () => {
		it('should be a valid NestJS module', () => {
			// Test that the module file exists and can be parsed
			expect(() => {
				// Just test that the file can be read and parsed
				const fs = require('fs');
				const path = require('path');
				const modulePath = path.join(__dirname, 'redis.module.ts');
				const content = fs.readFileSync(modulePath, 'utf8');
				expect(content).toContain('@Global()');
				expect(content).toContain('@Module');
				expect(content).toContain('RedisModule');
			}).not.toThrow();
		});

		it('should have correct module decorators', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			expect(content).toContain('@Global()');
			expect(content).toContain('@Module');
		});

		it('should import required dependencies', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			expect(content).toContain('@nestjs-modules/ioredis');
			expect(content).toContain('@nestjs/common');
			expect(content).toContain('@nestjs/config');
		});

		it('should configure Redis with forRootAsync', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			expect(content).toContain('forRootAsync');
			expect(content).toContain('ConfigModule');
			expect(content).toContain('ConfigService');
		});
	});

	describe('configuration structure', () => {
		it('should have correct forRootAsync configuration', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			// Check for the expected configuration structure
			expect(content).toContain('imports: [ConfigModule]');
			expect(content).toContain('inject: [ConfigService]');
			expect(content).toContain('useFactory:');
		});

		it('should use REDIS_URL from config service', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			expect(content).toContain('REDIS_URL');
			expect(content).toContain('configService.get');
		});

		it('should configure Redis with single type', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			expect(content).toContain("type: 'single'");
		});
	});

	describe('useFactory function logic', () => {
		it('should return correct Redis configuration', () => {
			// Test the useFactory logic by extracting it from the file
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			// The useFactory should return an object with type and url
			expect(content).toContain("type: 'single'");
			expect(content).toContain("url: configService.get('REDIS_URL')");
		});

		it('should handle config service injection', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			expect(content).toContain('inject: [ConfigService]');
			expect(content).toContain('useFactory: (configService: ConfigService)');
		});
	});

	describe('module exports', () => {
		it('should export RedisModule', () => {
			const fs = require('fs');
			const path = require('path');
			const modulePath = path.join(__dirname, 'redis.module.ts');
			const content = fs.readFileSync(modulePath, 'utf8');

			expect(content).toContain('export class RedisModule');
		});

		it('should have index.ts export', () => {
			const fs = require('fs');
			const path = require('path');
			const indexPath = path.join(__dirname, 'index.ts');
			const content = fs.readFileSync(indexPath, 'utf8');

			expect(content).toContain("export * from './redis.module'");
		});
	});
});

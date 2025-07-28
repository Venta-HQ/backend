import { describe, expect, it } from 'vitest';
import { configSchema } from './config.schema';

describe('ConfigSchema', () => {
	describe('valid configuration', () => {
		it('should validate a complete valid configuration', () => {
			const validConfig = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 3001,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(validConfig);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validConfig);
			}
		});

		it('should validate configuration with optional fields', () => {
			const validConfig = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: '3001',
				VENDOR_SERVICE_PORT: '3002',
				LOCATION_SERVICE_PORT: '3003',
				GATEWAY_SERVICE_PORT: '3000',
				WEBSOCKET_GATEWAY_SERVICE_PORT: '3004',
				ALGOLIA_SYNC_SERVICE_PORT: '3005',
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
				LOKI_PASSWORD: 'loki-password',
				LOKI_USERNAME: 'loki-username',
			};

			const result = configSchema.safeParse(validConfig);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validConfig);
			}
		});

		it('should use default NATS_URL when not provided', () => {
			const configWithoutNats = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 3001,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(configWithoutNats);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.NATS_URL).toBe('nats://localhost:4222');
			}
		});
	});

	describe('invalid configuration', () => {
		it('should reject configuration with missing required fields', () => {
			const invalidConfig = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				// Missing REDIS_PASSWORD
				REDIS_URL: 'redis://localhost:6379',
			};

			const result = configSchema.safeParse(invalidConfig);

			expect(result.success).toBe(false);
			if (!result.success) {
				// Should have multiple missing field errors
				expect(result.error.issues.length).toBeGreaterThan(1);
				// Check that REDIS_PASSWORD is one of the missing fields
				const missingFields = result.error.issues.map((issue) => issue.path[0]);
				expect(missingFields).toContain('REDIS_PASSWORD');
			}
		});

		it('should reject configuration with invalid URLs', () => {
			const invalidConfig = {
				DATABASE_URL: 'invalid-url',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 3001,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(invalidConfig);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0].path).toEqual(['DATABASE_URL']);
				expect(result.error.issues[0].code).toBe('invalid_string');
			}
		});

		it('should accept any string or number for service ports', () => {
			const config = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 'invalid-port',
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should accept empty strings for required fields', () => {
			const config = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: '',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 3001,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should reject configuration with multiple validation errors', () => {
			const invalidConfig = {
				DATABASE_URL: 'invalid-url',
				REDIS_PASSWORD: '',
				REDIS_URL: 'invalid-redis-url',
				// Missing other required fields
			};

			const result = configSchema.safeParse(invalidConfig);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(1);
			}
		});
	});

	describe('service ports validation', () => {
		it('should accept numeric ports', () => {
			const config = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 3001,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should accept string ports', () => {
			const config = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: '3001',
				VENDOR_SERVICE_PORT: '3002',
				LOCATION_SERVICE_PORT: '3003',
				GATEWAY_SERVICE_PORT: '3000',
				WEBSOCKET_GATEWAY_SERVICE_PORT: '3004',
				ALGOLIA_SYNC_SERVICE_PORT: '3005',
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(config);

			expect(result.success).toBe(true);
		});

		it('should reject invalid port types', () => {
			const config = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: true,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(config);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0].path).toEqual(['USER_SERVICE_PORT']);
				expect(result.error.issues[0].code).toBe('invalid_union');
			}
		});
	});

	describe('optional fields', () => {
		it('should accept configuration without optional fields', () => {
			const config = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 3001,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
			};

			const result = configSchema.safeParse(config);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.LOKI_PASSWORD).toBeUndefined();
				expect(result.data.LOKI_USERNAME).toBeUndefined();
			}
		});

		it('should accept configuration with some optional fields', () => {
			const config = {
				DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
				REDIS_PASSWORD: 'redis-password',
				REDIS_URL: 'redis://localhost:6379',
				NATS_URL: 'nats://localhost:4222',
				USER_SERVICE_URL: 'http://localhost:3001',
				VENDOR_SERVICE_URL: 'http://localhost:3002',
				LOCATION_SERVICE_URL: 'http://localhost:3003',
				GATEWAY_SERVICE_URL: 'http://localhost:3000',
				WEBSOCKET_GATEWAY_SERVICE_URL: 'http://localhost:3004',
				ALGOLIA_SYNC_SERVICE_URL: 'http://localhost:3005',
				USER_SERVICE_PORT: 3001,
				VENDOR_SERVICE_PORT: 3002,
				LOCATION_SERVICE_PORT: 3003,
				GATEWAY_SERVICE_PORT: 3000,
				WEBSOCKET_GATEWAY_SERVICE_PORT: 3004,
				ALGOLIA_SYNC_SERVICE_PORT: 3005,
				ALGOLIA_API_KEY: 'algolia-api-key',
				ALGOLIA_APPLICATION_ID: 'algolia-app-id',
				CLERK_SECRET_KEY: 'clerk-secret-key',
				CLOUDINARY_API_KEY: 'cloudinary-api-key',
				CLOUDINARY_API_SECRET: 'cloudinary-api-secret',
				CLOUDINARY_CLOUD_NAME: 'cloudinary-cloud-name',
				PULSE_API_KEY: 'pulse-api-key',
				LOKI_URL: 'http://localhost:3100',
				LOKI_PASSWORD: 'loki-password',
				// LOKI_USERNAME is missing
			};

			const result = configSchema.safeParse(config);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.LOKI_PASSWORD).toBe('loki-password');
				expect(result.data.LOKI_USERNAME).toBeUndefined();
			}
		});
	});
});

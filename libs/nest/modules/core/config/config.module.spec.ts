import { describe, expect, it } from 'vitest';
import { configSchema } from './config.schema';

describe('ConfigModule schema', () => {
	it('validates minimal valid env', () => {
		const env = {
			ALGOLIA_API_KEY: 'a',
			ALGOLIA_APPLICATION_ID: 'b',
			ALGOLIA_SYNC_HEALTH_PORT: '3000',
			CLERK_SECRET_KEY: 's',
			CLOUDINARY_API_KEY: 'ck',
			CLOUDINARY_API_SECRET: 'cs',
			CLOUDINARY_CLOUD_NAME: 'cn',
			DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
			GATEWAY_SERVICE_PORT: '4000',
			LOCATION_HEALTH_PORT: '3001',
			LOCATION_SERVICE_ADDRESS: 'localhost:5001',
			LOKI_URL: 'https://loki.example.com',
			NATS_URL: 'nats://localhost:4222',
			NODE_ENV: 'test',
			PULSE_API_KEY: 'pulse',
			REDIS_PASSWORD: 'r',
			REDIS_URL: 'redis://localhost:6379',
			USER_HEALTH_PORT: '3002',
			USER_SERVICE_ADDRESS: 'localhost:5002',
			VENDOR_HEALTH_PORT: '3003',
			VENDOR_SERVICE_ADDRESS: 'localhost:5003',
			WEBSOCKET_GATEWAY_SERVICE_PORT: '4001',
			OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'https://otel.example.com',
		};
		const res = configSchema.safeParse(env);
		expect(res.success).toBe(true);
	});

	it('fails with invalid DATABASE_URL', () => {
		const env: any = { ...({} as any) };
		const res = configSchema.safeParse({
			DATABASE_URL: 'not-a-url',
			LOKI_URL: 'https://x.com',
			ALGOLIA_API_KEY: 'a',
			ALGOLIA_APPLICATION_ID: 'b',
			ALGOLIA_SYNC_HEALTH_PORT: '1',
			CLERK_SECRET_KEY: 's',
			CLOUDINARY_API_KEY: 'a',
			CLOUDINARY_API_SECRET: 'b',
			CLOUDINARY_CLOUD_NAME: 'c',
			GATEWAY_SERVICE_PORT: '1',
			LOCATION_HEALTH_PORT: '1',
			LOCATION_SERVICE_ADDRESS: 'x',
			NATS_URL: 'nats://localhost:4222',
			NODE_ENV: 'test',
			PULSE_API_KEY: 'p',
			REDIS_PASSWORD: 'r',
			REDIS_URL: 'redis://localhost:6379',
			USER_HEALTH_PORT: '1',
			USER_SERVICE_ADDRESS: 'x',
			VENDOR_HEALTH_PORT: '1',
			VENDOR_SERVICE_ADDRESS: 'x',
			WEBSOCKET_GATEWAY_SERVICE_PORT: '1',
			OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'https://otel.example.com',
		});
		expect(res.success).toBe(false);
	});
});

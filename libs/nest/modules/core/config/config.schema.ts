import { z } from 'zod';

export const configSchema = z.object({
	// Required services
	ALGOLIA_API_KEY: z.string(),
	ALGOLIA_APPLICATION_ID: z.string(),
	ALGOLIA_SYNC_HEALTH_PORT: z.string().or(z.number()),

	// CORS Configuration
	ALLOWED_ORIGINS: z.string().optional(),
	// Application configuration
	APP_NAME: z.string().optional(),
	DOMAIN: z.string().optional(), // DDD domain (e.g., 'user', 'vendor', 'location', 'marketplace')
	CLERK_SECRET_KEY: z.string(),
	CLOUDINARY_API_KEY: z.string(),
	CLOUDINARY_API_SECRET: z.string(),
	CLOUDINARY_CLOUD_NAME: z.string(),
	// Required core services
	DATABASE_URL: z.string().url(),
	GATEWAY_SERVICE_PORT: z.string().or(z.number()),
	GIT_COMMIT: z.string().optional(),
	LOCATION_HEALTH_PORT: z.string().or(z.number()),
	LOCATION_SERVICE_ADDRESS: z.string(),

	// Optional services
	LOKI_PASSWORD: z.string().optional(),

	// Logging
	LOKI_ENABLED: z
		.union([z.string(), z.boolean()])
		.transform((v) => {
			const str = String(v).toLowerCase();
			if (['false', '0', 'no', 'off'].includes(str)) return false;
			if (['true', '1', 'yes', 'on'].includes(str)) return true;
			return true; // default enabled when present
		})
		.optional(),
	LOKI_MIN_LEVEL: z
		.enum(['error', 'warn', 'log', 'debug', 'verbose', 'info'])
		.transform((v) => (v === 'info' ? 'log' : v))
		.optional(),
	LOKI_URL: z.string().url(),
	LOKI_USERNAME: z.string().optional(),
	NATS_URL: z.string().default('nats://localhost:4222'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	REDIS_PASSWORD: z.string(),
	REDIS_URL: z.string().url(),
	USER_HEALTH_PORT: z.string().or(z.number()),
	USER_SERVICE_ADDRESS: z.string(),
	FILE_MANAGEMENT_SERVICE_ADDRESS: z.string().optional(),
	VENDOR_HEALTH_PORT: z.string().or(z.number()),
	VENDOR_SERVICE_ADDRESS: z.string(),
	WEBSOCKET_GATEWAY_SERVICE_PORT: z.string().or(z.number()),
	WEBHOOKS_GATEWAY_SERVICE_PORT: z.string().or(z.number()),
	// Tracing
	OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().url(),
});

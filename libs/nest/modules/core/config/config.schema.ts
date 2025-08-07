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
	LOKI_URL: z.string().url(),
	LOKI_USERNAME: z.string().optional(),
	NATS_URL: z.string().default('nats://localhost:4222'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PULSE_API_KEY: z.string(),
	REDIS_PASSWORD: z.string(),
	REDIS_URL: z.string().url(),
	USER_HEALTH_PORT: z.string().or(z.number()),
	USER_SERVICE_ADDRESS: z.string(),
	VENDOR_HEALTH_PORT: z.string().or(z.number()),
	VENDOR_SERVICE_ADDRESS: z.string(),
	WEBSOCKET_GATEWAY_SERVICE_PORT: z.string().or(z.number()),
});

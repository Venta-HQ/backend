import { z } from 'zod';

export const configSchema = z.object({
	// Required services
	ALGOLIA_API_KEY: z.string(),
	ALGOLIA_APPLICATION_ID: z.string(),
	ALGOLIA_SYNC_SERVICE_PORT: z.string().or(z.number()),
	ALGOLIA_SYNC_SERVICE_URL: z.string(),

	// CORS Configuration
	ALLOWED_ORIGINS: z.string().optional(),
	CLERK_SECRET_KEY: z.string(),
	CLOUDINARY_API_KEY: z.string(),
	CLOUDINARY_API_SECRET: z.string(),
	CLOUDINARY_CLOUD_NAME: z.string(),
	// Required core services
	DATABASE_URL: z.string().url(),
	GATEWAY_SERVICE_PORT: z.string().or(z.number()),
	GATEWAY_SERVICE_URL: z.string(),
	LOCATION_SERVICE_ADDRESS: z.string(),
	LOCATION_SERVICE_PORT: z.string().or(z.number()),
	LOCATION_SERVICE_URL: z.string(),

	// Optional services
	LOKI_PASSWORD: z.string().optional(),

	// Logging
	LOKI_URL: z.string().url(),
	LOKI_USERNAME: z.string().optional(),
	NATS_URL: z.string().default('nats://localhost:4222'),
	PULSE_API_KEY: z.string(),
	REDIS_PASSWORD: z.string(),
	REDIS_URL: z.string().url(),

	// Service URLs (for local development)
	USER_SERVICE_ADDRESS: z.string(),

	// Service Ports (for local development)
	USER_SERVICE_PORT: z.string().or(z.number()),
	USER_SERVICE_URL: z.string(),
	VENDOR_SERVICE_ADDRESS: z.string(),
	VENDOR_SERVICE_PORT: z.string().or(z.number()),
	VENDOR_SERVICE_URL: z.string(),
	WEBSOCKET_GATEWAY_SERVICE_PORT: z.string().or(z.number()),
	WEBSOCKET_GATEWAY_SERVICE_URL: z.string(),
});

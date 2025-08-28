import { z } from 'zod';

// Group: Required third-party services
const requiredServicesSchema = z.object({
	// Algolia admin/search key
	ALGOLIA_API_KEY: z.string(),
	// Algolia application identifier
	ALGOLIA_APPLICATION_ID: z.string(),
	// Health check port for Algolia sync worker
	ALGOLIA_SYNC_HEALTH_PORT: z.string().or(z.number()),
});

// Group: CORS configuration
const corsSchema = z.object({
	// Comma-separated origin allowlist for WS/HTTP
	ALLOWED_ORIGINS: z.string().optional(),
});

// Group: WebSocket configuration
const websocketSchema = z.object({
	// Max Socket.IO message payload size (bytes)
	WS_MAX_PAYLOAD_BYTES: z.string().or(z.number()).optional(),
	// Socket.IO ping interval (ms)
	WS_PING_INTERVAL_MS: z.string().or(z.number()).optional(),
	// Socket.IO ping timeout (ms)
	WS_PING_TIMEOUT_MS: z.string().or(z.number()).optional(),
	// Enable verbose handshake logging (true/false)
	WS_LOG_HANDSHAKES: z
		.union([z.string(), z.boolean()])
		.transform((v) => {
			const str = String(v).toLowerCase();
			if (['false', '0', 'no', 'off'].includes(str)) return false;
			if (['true', '1', 'yes', 'on'].includes(str)) return true;
			return false;
		})
		.optional(),
	// Presence key TTL in Redis (seconds)
	WS_PRESENCE_TTL_SECONDS: z.string().or(z.number()).optional(),
	// Min interval between presence touch operations (ms)
	WS_PRESENCE_REFRESH_MIN_MS: z.string().or(z.number()).optional(),
});

// Group: Application configuration
const appSchema = z.object({
	// Service name used in logs/metrics/tracing
	APP_NAME: z.string().optional(),
	// DDD domain (e.g., 'user', 'vendor', 'location', 'marketplace')
	DOMAIN: z.string().optional(),
	// Clerk backend API key
	CLERK_SECRET_KEY: z.string(),
	// Cloudinary credentials
	CLOUDINARY_API_KEY: z.string(),
	CLOUDINARY_API_SECRET: z.string(),
	CLOUDINARY_CLOUD_NAME: z.string(),
});

// Group: Core services / networking
const coreServicesSchema = z.object({
	// Primary database connection URL
	DATABASE_URL: z.string().url(),
	// API Gateway HTTP port
	GATEWAY_SERVICE_PORT: z.string().or(z.number()),
	// Build commit SHA (for metrics/info)
	GIT_COMMIT: z.string().optional(),
	// Geolocation service health port
	LOCATION_HEALTH_PORT: z.string().or(z.number()),
	// Geolocation service gRPC address
	LOCATION_SERVICE_ADDRESS: z.string(),
	// Loki basic auth password (if enabled)
	LOKI_PASSWORD: z.string().optional(),
	// Enable/disable Loki log shipping
	LOKI_ENABLED: z
		.union([z.string(), z.boolean()])
		.transform((v) => {
			const str = String(v).toLowerCase();
			if (['false', '0', 'no', 'off'].includes(str)) return false;
			if (['true', '1', 'yes', 'on'].includes(str)) return true;
			return true; // default enabled when present
		})
		.optional(),
	// Minimum log level forwarded to Loki
	LOKI_MIN_LEVEL: z
		.enum(['error', 'warn', 'log', 'debug', 'verbose', 'info'])
		.transform((v) => (v === 'info' ? 'log' : v))
		.optional(),
	// Loki endpoint URL
	LOKI_URL: z.string().url(),
	// Loki basic auth username (if enabled)
	LOKI_USERNAME: z.string().optional(),
	// NATS broker URL
	NATS_URL: z.string().default('nats://localhost:4222'),
	// Runtime environment
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	// Redis credentials/URL
	REDIS_PASSWORD: z.string(),
	REDIS_URL: z.string().url(),
	// User service health port
	USER_HEALTH_PORT: z.string().or(z.number()),
	// User service gRPC address
	USER_SERVICE_ADDRESS: z.string(),
	// File management service gRPC address and health port
	FILE_MANAGEMENT_SERVICE_ADDRESS: z.string().optional(),
	FILE_MANAGEMENT_HEALTH_PORT: z.string().or(z.number()).optional(),
	// Vendor service health port and gRPC address
	VENDOR_HEALTH_PORT: z.string().or(z.number()),
	VENDOR_SERVICE_ADDRESS: z.string(),
	// WebSocket gateway HTTP port
	WEBSOCKET_GATEWAY_SERVICE_PORT: z.string().or(z.number()),
	// Webhooks gateway HTTP port
	WEBHOOKS_GATEWAY_SERVICE_PORT: z.string().or(z.number()),
});

// Group: Tracing / observability
const tracingSchema = z.object({
	// OTLP traces exporter endpoint and extra resource attributes
	OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().url(),
	OTEL_RESOURCE_ATTRIBUTES: z.string().optional(),
});

export const configSchema = requiredServicesSchema
	.merge(corsSchema)
	.merge(websocketSchema)
	.merge(appSchema)
	.merge(coreServicesSchema)
	.merge(tracingSchema);

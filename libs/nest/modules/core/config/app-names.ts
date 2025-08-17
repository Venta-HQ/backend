/**
 * Centralized app names configuration
 *
 * This file contains all the app names used across the Venta backend services.
 * Using this ensures consistency and makes it easy to update app names in one place.
 */
export const APP_NAMES = {
	ALGOLIA_SYNC: 'algolia-sync',
	CLERK_WEBHOOKS: 'clerk-webhooks',
	FILE_MANAGEMENT: 'file-management',
	GATEWAY: 'api-gateway',
	LOCATION: 'location-service',
	SUBSCRIPTION_WEBHOOKS: 'subscription-webhooks',
	USER: 'user-service',
	VENDOR: 'vendor-service',
	LOCATION_GATEWAY: 'location-gateway',
} as const;

export type AppName = (typeof APP_NAMES)[keyof typeof APP_NAMES];

/**
 * Helper function to get app name by service key
 */
export function getAppName(serviceKey: keyof typeof APP_NAMES): AppName {
	return APP_NAMES[serviceKey];
}

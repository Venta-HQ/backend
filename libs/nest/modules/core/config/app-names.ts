/**
 * Centralized app names configuration
 *
 * This file contains all the app names used across the Venta backend services.
 * Using this ensures consistency and makes it easy to update app names in one place.
 */
export const APP_NAMES = {
	ALGOLIA_SYNC: 'Algolia Sync Service',
	GATEWAY: 'Gateway Service',
	LOCATION: 'Location Microservice',
	USER: 'User Microservice',
	VENDOR: 'Vendor Microservice',
	WEBSOCKET_GATEWAY: 'Websocket Gateway Microservice',
} as const;

export type AppName = (typeof APP_NAMES)[keyof typeof APP_NAMES];

/**
 * Helper function to get app name by service key
 */
export function getAppName(serviceKey: keyof typeof APP_NAMES): AppName {
	return APP_NAMES[serviceKey];
}

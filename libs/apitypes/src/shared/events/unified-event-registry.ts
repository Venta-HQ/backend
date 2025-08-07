import { userEventSchemas, UserLocationUpdateEventData } from '../../domains/user/user.events';
import { VendorEventData, vendorEventSchemas, VendorLocationUpdateEventData } from '../../domains/vendor/vendor.events';

/**
 * Combine all domain event schemas
 * This provides intellisense for all available events
 */
export const ALL_EVENT_SCHEMAS = {
	...userEventSchemas,
	...vendorEventSchemas,
	// Add other domain schemas here as they're created:
	// ...locationEventSchemas,
} as const;

/**
 * Type that represents all available event subjects
 * This provides intellisense for the emit method
 */
export type AvailableEventSubjects = keyof typeof ALL_EVENT_SCHEMAS;

/**
 * Type mapping from subject to data type
 * This provides type safety for the second parameter of emit
 */
export type EventDataMap = {
	// User events
	'user.location.updated': UserLocationUpdateEventData;

	// Vendor events
	'vendor.created': VendorEventData;
	'vendor.deleted': VendorEventData;
	'vendor.location.updated': VendorLocationUpdateEventData;
	'vendor.updated': VendorEventData;
};

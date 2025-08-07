import { VendorEventData, VendorLocationUpdateEventData, vendorEventSchemas } from '../../domains/vendor/vendor.events';
import { locationEventSchemas, LocationEventDataMap } from '../../domains/location/location.events';

/**
 * Combine all domain event schemas
 * This provides intellisense for all available events
 */
export const ALL_EVENT_SCHEMAS = {
	...vendorEventSchemas,
	...locationEventSchemas,
	// Add other domain schemas here as they're created:
	// ...userEventSchemas,
	// ...marketplaceEventSchemas,
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
	// Vendor events
	'vendor.created': VendorEventData;
	'vendor.deleted': VendorEventData;
	'vendor.updated': VendorEventData;
	'vendor.location.updated': VendorLocationUpdateEventData;
	
	// Location events
	'location.vendor_location_updated': LocationEventDataMap['location.vendor_location_updated'];
	'location.user_location_updated': LocationEventDataMap['location.user_location_updated'];
	'location.proximity_alert': LocationEventDataMap['location.proximity_alert'];
	'location.vendor_location_removed': LocationEventDataMap['location.vendor_location_removed'];
	'location.geolocation_search_completed': LocationEventDataMap['location.geolocation_search_completed'];
};

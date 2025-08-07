import { userEventSchemas, UserEventDataMap } from '../domains/marketplace/user/user.events';
import { vendorEventSchemas, VendorEventDataMap } from '../domains/marketplace/vendor/vendor.events';

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
 * Combines all domain event data mappings
 */
export type EventDataMap = UserEventDataMap & VendorEventDataMap; 
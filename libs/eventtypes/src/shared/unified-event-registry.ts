import { LocationEventDataMap, locationEventSchemas } from '@domains/location-services/events/location.events';
import { VendorEventDataMap, vendorEventSchemas } from '@domains/marketplace/events/vendor/vendor.events';

/**
 * Combine all domain event schemas
 * This provides intellisense for all available events
 */
export const ALL_EVENT_SCHEMAS = {
	...vendorEventSchemas,
	...locationEventSchemas,
	// Add other domain schemas here as they're created
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
export type EventDataMap = VendorEventDataMap & LocationEventDataMap;

/**
 * Get all event names for a specific domain
 */
export function getEventsForDomain(domain: string): AvailableEventSubjects[] {
	return Object.keys(ALL_EVENT_SCHEMAS).filter((eventName) =>
		eventName.startsWith(`${domain}.`),
	) as AvailableEventSubjects[];
}

/**
 * Get all event names for a specific subdomain
 */
export function getEventsForSubdomain(domain: string, subdomain: string): AvailableEventSubjects[] {
	return Object.keys(ALL_EVENT_SCHEMAS).filter((eventName) =>
		eventName.startsWith(`${domain}.${subdomain}.`),
	) as AvailableEventSubjects[];
}

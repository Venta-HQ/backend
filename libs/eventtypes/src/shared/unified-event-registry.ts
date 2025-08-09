import {
	CommunicationEventDataMap,
	communicationEventSchemas,
} from '@venta/domains/communication/events/communication.events';
import { LocationEventDataMap, locationEventSchemas } from '@venta/domains/location-services/events/location.events';
import { VendorEventDataMap, vendorEventSchemas } from '@venta/domains/marketplace/events/vendor/vendor.events';
import { ValidDomain, ValidSubdomain } from './event-schema-types';

/**
 * Combine all domain event schemas
 * This provides intellisense for all available events
 */
export const ALL_EVENT_SCHEMAS = {
	...vendorEventSchemas,
	...locationEventSchemas,
	...communicationEventSchemas,
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
export type EventDataMap = VendorEventDataMap & LocationEventDataMap & CommunicationEventDataMap;

/**
 * Get all event names for a specific domain
 */
export function getEventsForDomain(domain: ValidDomain): AvailableEventSubjects[] {
	return Object.keys(ALL_EVENT_SCHEMAS).filter((eventName) =>
		eventName.startsWith(`${domain}.`),
	) as AvailableEventSubjects[];
}

/**
 * Get all event names for a specific subdomain
 */
export function getEventsForSubdomain<TDomain extends ValidDomain>(
	domain: TDomain,
	subdomain: ValidSubdomain<TDomain>,
): AvailableEventSubjects[] {
	return Object.keys(ALL_EVENT_SCHEMAS).filter((eventName) =>
		eventName.startsWith(`${domain}.${subdomain}.`),
	) as AvailableEventSubjects[];
}

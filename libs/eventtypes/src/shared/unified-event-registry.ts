import {
	CommunicationEventDataMap,
	communicationEventSchemas,
	InfrastructureEventDataMap,
	infrastructureEventSchemas,
	LocationEventDataMap,
	locationEventSchemas,
	VendorEventDataMap,
	vendorEventSchemas,
} from '../domains';
import { ValidDomain, ValidSubdomain } from './event-schema-types';

/**
 * Combine all domain event schemas
 * This provides intellisense for all available events
 */
export const ALL_EVENT_SCHEMAS = {
	...communicationEventSchemas,
	...infrastructureEventSchemas,
	...locationEventSchemas,
	...vendorEventSchemas,
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
export type EventDataMap = CommunicationEventDataMap &
	InfrastructureEventDataMap &
	LocationEventDataMap &
	VendorEventDataMap;

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

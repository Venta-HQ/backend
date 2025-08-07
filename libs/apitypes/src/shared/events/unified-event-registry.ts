import { z } from 'zod';
import { userEventSchemas } from '../../domains/user/user.events';
import { vendorEventSchemas } from '../../domains/vendor/vendor.events';

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
 * Auto-inferred from ALL_EVENT_SCHEMAS - optional fields remain optional as defined in schema
 */
export type EventDataMap = {
	[K in AvailableEventSubjects]: z.infer<(typeof ALL_EVENT_SCHEMAS)[K]>;
};

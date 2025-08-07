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
 * Utility type to infer Zod schema types while preserving required fields
 * This ensures that required fields in the schema remain required in the inferred type
 */
type InferRequired<T> = {
	[K in keyof T]-?: T[K];
};

/**
 * Type mapping from subject to data type
 * This provides type safety for the second parameter of emit
 * Auto-inferred from ALL_EVENT_SCHEMAS while preserving required fields
 */
export type EventDataMap = {
	[K in AvailableEventSubjects]: InferRequired<z.infer<(typeof ALL_EVENT_SCHEMAS)[K]>>;
};

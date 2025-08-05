import { VENDOR_EVENT_SUBJECTS } from '../vendor/vendor.events';

/**
 * Combine all domain event subjects into a single const assertion
 * This provides intellisense for all available events
 */
export const ALL_EVENT_SUBJECTS = [
	...VENDOR_EVENT_SUBJECTS,
	// Add other domain subjects here as they're created:
	// ...USER_EVENT_SUBJECTS,
	// ...LOCATION_EVENT_SUBJECTS,
] as const;

/**
 * Type that represents all available event subjects
 * This provides intellisense for the emit method
 */
export type AvailableEventSubjects = (typeof ALL_EVENT_SUBJECTS)[number];

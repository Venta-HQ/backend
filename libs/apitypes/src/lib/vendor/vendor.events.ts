import { z } from 'zod';
import { BaseEvent } from '../events/base.types';
import { eventRegistry } from '../events/event-registry';

/**
 * Vendor event data schema
 */
export const vendorEventDataSchema = z.object({
	createdAt: z.string().optional(),
	description: z.string().optional(),
	email: z.string().optional(),
	id: z.string(),
	lat: z.number().optional(),
	long: z.number().optional(),
	name: z.string(),
	open: z.boolean().optional(),
	phone: z.string().optional(),
	primaryImage: z.string().optional(),
	updatedAt: z.string().optional(),
	website: z.string().optional(),
});

/**
 * Vendor event interface
 */
export interface VendorEventData extends BaseEvent {
	data: z.infer<typeof vendorEventDataSchema>;
}

/**
 * Vendor event subject patterns for type safety
 */
export type VendorEventSubject = 'vendor.created' | 'vendor.updated' | 'vendor.deleted';

/**
 * Vendor event subjects as const assertion
 * This is used to generate the union type for intellisense
 */
export const VENDOR_EVENT_SUBJECTS = ['vendor.created', 'vendor.updated', 'vendor.deleted'] as const;

/**
 * Register vendor events with the global registry
 */
eventRegistry.register('vendor.created', vendorEventDataSchema);
eventRegistry.register('vendor.updated', vendorEventDataSchema);
eventRegistry.register('vendor.deleted', vendorEventDataSchema);

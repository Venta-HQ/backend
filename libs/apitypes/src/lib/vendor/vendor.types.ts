import { z } from 'zod';
import { CreateVendorSchema, UpdateVendorSchema } from './vendor.schemas';

export type CreateVendorData = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorData = z.infer<typeof UpdateVendorSchema>;

export interface VendorEvent {
	data: {
		createdAt: Date;
		description?: string;
		email?: string;
		id: string;
		lat?: number;
		long?: number;
		name: string;
		open: boolean;
		phone?: string;
		primaryImage?: string;
		updatedAt: Date;
		website?: string;
	};
	type: 'vendor.created' | 'vendor.updated' | 'vendor.deleted';
}

export interface VendorCreatedEvent extends VendorEvent {
	type: 'vendor.created';
}

export interface VendorUpdatedEvent extends VendorEvent {
	type: 'vendor.updated';
}

export interface VendorDeletedEvent extends VendorEvent {
	type: 'vendor.deleted';
}

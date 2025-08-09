import type { z } from 'zod';
import { GrpcVendorCreateDataSchema, GrpcVendorUpdateDataSchema } from '../../schemas/vendor/vendor.schemas';

export type CreateVendorData = z.infer<typeof GrpcVendorCreateDataSchema>;
export type UpdateVendorData = z.infer<typeof GrpcVendorUpdateDataSchema>;

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

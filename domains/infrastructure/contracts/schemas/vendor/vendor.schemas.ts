import { z } from 'zod';

// Base vendor data schema
export const vendorDataSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string(),
	email: z.string().email(),
	phone: z.string().optional(),
	website: z.string().url().optional(),
	imageUrl: z.string().url().optional(),
	isOpen: z.boolean().optional(),
});

// Schema for creating a new vendor
export const CreateVendorSchema = vendorDataSchema;

// Schema for updating an existing vendor
export const UpdateVendorSchema = vendorDataSchema.partial();

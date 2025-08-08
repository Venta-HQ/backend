import { z } from 'zod';

// Base vendor data schema
const vendorDataSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional(),
	email: z.string().email().optional(),
	imageUrl: z.string().url().optional(),
	phone: z.string().optional(),
	website: z.string().url().optional(),
});

// Schema for creating a new vendor
export const CreateVendorSchema = vendorDataSchema;

// Schema for updating an existing vendor
export const UpdateVendorSchema = vendorDataSchema.partial();

// Type for creating a new vendor
export type CreateVendorData = z.infer<typeof CreateVendorSchema>;

// Type for updating an existing vendor
export type UpdateVendorData = z.infer<typeof UpdateVendorSchema>;

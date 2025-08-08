import { z } from 'zod';

export const CreateVendorSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	website: z.string().url().optional(),
	imageUrl: z.string().url().optional(),
});

export const UpdateVendorSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	website: z.string().url().optional(),
	imageUrl: z.string().url().optional(),
});

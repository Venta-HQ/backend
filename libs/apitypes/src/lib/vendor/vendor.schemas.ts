import { z } from 'zod';

export const CreateVendorSchema = z.object({
	description: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	imageUrl: z.string().nullable().optional(),
	name: z.string(),
	phone: z.string().nullable().optional(),
	userId: z.string(),
	website: z.string().nullable().optional(),
});

export const CreateVendorAPISchema = z.object({
	description: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	imageUrl: z.string().nullable().optional(),
	name: z.string(),
	phone: z.string().nullable().optional(),
	website: z.string().nullable().optional(),
});

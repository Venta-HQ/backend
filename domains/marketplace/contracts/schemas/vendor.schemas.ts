import { z } from 'zod';

export const grpcVendorLookupSchema = z.object({
	id: z.string(),
});

export const grpcVendorCreateSchema = z.object({
	name: z.string(),
	description: z.string().optional().nullable(),
	email: z.string().email(),
	phone: z.string().optional().nullable(),
	website: z.string().url().optional().nullable(),
	profileImage: z.string().optional().nullable(),
});

export const grpcVendorUpdateSchema = z.object({
	id: z.string(),
	name: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	email: z.string().email().optional().nullable(),
	phone: z.string().optional().nullable(),
	website: z.string().url().optional().nullable(),
	profileImage: z.string().optional().nullable(),
});

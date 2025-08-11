import { z } from 'zod';

export const grpcVendorLookupSchema = z.object({
	id: z.string(),
});

export const grpcVendorCreateSchema = z.object({
	name: z.string(),
	description: z.string(),
	email: z.string().email(),
	phone: z.string(),
	website: z.string().url(),
	imageUrl: z.string(),
});

export const grpcVendorUpdateSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	email: z.string().email(),
	phone: z.string(),
	website: z.string().url(),
	imageUrl: z.string(),
});

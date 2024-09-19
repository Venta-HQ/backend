import { z } from 'zod';

export const CreateVendorSchema = z.object({
	description: z.string().optional(),
	email: z.string().optional(),
	imageUrl: z.string().optional(),
	name: z.string(),
	phone: z.string().optional(),
	website: z.string().optional(),
});

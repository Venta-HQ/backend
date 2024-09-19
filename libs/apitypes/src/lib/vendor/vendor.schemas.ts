import { z } from 'zod';

export const CreateVendorSchema = z.object({
	clerkUserId: z.string(),
	description: z.string(),
	email: z.string(),
	imageUrl: z.string(),
	name: z.string(),
	phone: z.string(),
	website: z.string(),
});

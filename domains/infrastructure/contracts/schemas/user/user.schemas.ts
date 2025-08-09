import { z } from 'zod';

export const UserVendorRequestSchema = z.object({
	userId: z.string().uuid(),
});

export const UserDataSchema = z.object({
	email: z.string().email(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
});

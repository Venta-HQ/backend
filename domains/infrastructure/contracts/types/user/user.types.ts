import { z } from 'zod';

// Base user data schema
export const UserDataSchema = z.object({
	email: z.string().email(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
});

// Type for user data
export type UserData = z.infer<typeof UserDataSchema>;

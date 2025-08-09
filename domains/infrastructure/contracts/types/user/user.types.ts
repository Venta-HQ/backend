import { z } from 'zod';
import { UserVendorRequestSchema } from '../../schemas/user/user.schemas';

// Base user data schema
export const UserDataSchema = z.object({
	email: z.string().email(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
});

// Type for user data
export type UserData = z.infer<typeof UserDataSchema>;

// Type for user vendor request
export type UserVendorRequest = z.infer<typeof UserVendorRequestSchema>;

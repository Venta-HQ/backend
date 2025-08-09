import { z } from 'zod';

export const AuthRequestSchema = z.object({
	userId: z.string().uuid(),
	clerkId: z.string(),
});

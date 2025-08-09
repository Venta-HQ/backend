import { Request } from 'express';
import { z } from 'zod';
import { AuthRequestSchema } from '../../schemas/auth/auth.schemas';

// Type for authenticated request
export interface AuthedRequest extends Request {
	userId: string;
	clerkId: string;
}

// Type for auth request data
export type AuthRequest = z.infer<typeof AuthRequestSchema>;

import { z } from 'zod';

export const grpcUserIdentitySchema = z.object({
	id: z.string(),
});

import { z } from 'zod';

export const UserVendorRequestSchema = z.object({
	userId: z.string().uuid(),
});

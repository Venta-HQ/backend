import type { z } from 'zod';
import { UserDataSchema, UserVendorRequestSchema } from '../../schemas/user/user.schemas';

export type UserData = z.infer<typeof UserDataSchema>;
export type UserVendorRequest = z.infer<typeof UserVendorRequestSchema>;

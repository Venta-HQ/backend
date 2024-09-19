import { z } from 'zod';
import { CreateVendorSchema } from './vendor.schemas';

export type CreateVendorData = z.infer<typeof CreateVendorSchema>;

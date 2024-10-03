import { z } from 'zod';
import { CreateVendorSchema, UpdateVendorSchema } from './vendor.schemas';

export type CreateVendorData = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorData = z.infer<typeof UpdateVendorSchema>;

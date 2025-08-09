import { z } from 'zod';
import { CreateVendorSchema, UpdateVendorSchema } from '../../schemas/vendor/vendor.schemas';

// Type for creating a new vendor
export type CreateVendorData = z.infer<typeof CreateVendorSchema>;

// Type for updating an existing vendor
export type UpdateVendorData = z.infer<typeof UpdateVendorSchema>;

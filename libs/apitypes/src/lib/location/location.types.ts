import { z } from 'zod';
import { UpdateUserLocationDataSchema, VendorLocationUpdateDataSchema } from './location.schemas';

export type VendorLocationUpdateData = z.infer<typeof VendorLocationUpdateDataSchema>;
export type UpdateUserLocationData = z.infer<typeof UpdateUserLocationDataSchema>;

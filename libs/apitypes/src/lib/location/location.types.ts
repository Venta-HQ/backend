import { z } from 'zod';
import { GenericLocationSyncDataSchema, VendorLocationsRequestDataSchema } from './location.schemas';

export type GenericLocationSyncData = z.infer<typeof GenericLocationSyncDataSchema>;
export type VendorLocationsRequestData = z.infer<typeof VendorLocationsRequestDataSchema>;

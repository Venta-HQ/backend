import { z } from 'zod';
import { 
	UpdateUserLocationDataSchema, 
	VendorLocationUpdateDataSchema,
	LocationDataSchema,
	LocationUpdateDataSchema
} from './location.schemas';

export type VendorLocationUpdateData = z.infer<typeof VendorLocationUpdateDataSchema>;
export type UpdateUserLocationData = z.infer<typeof UpdateUserLocationDataSchema>;
export type LocationData = z.infer<typeof LocationDataSchema>;
export type LocationUpdateData = z.infer<typeof LocationUpdateDataSchema>;

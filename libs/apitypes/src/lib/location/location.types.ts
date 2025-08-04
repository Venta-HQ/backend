import { z } from 'zod';
import {
	LocationDataSchema,
	LocationUpdateDataSchema,
	UpdateUserLocationDataSchema,
	VendorLocationUpdateDataSchema,
} from './location.schemas';

export type VendorLocationUpdateData = z.infer<typeof VendorLocationUpdateDataSchema>;
export type UpdateUserLocationData = z.infer<typeof UpdateUserLocationDataSchema>;
export type LocationData = z.infer<typeof LocationDataSchema>;
export type LocationUpdateData = z.infer<typeof LocationUpdateDataSchema>;

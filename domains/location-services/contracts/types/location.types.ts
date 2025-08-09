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

export interface VendorLocation {
	vendorId: string;
	coordinates: {
		lat: number;
		long: number;
	};
}

export interface GeolocationService {
	updateVendorLocation(request: {
		entityId: string;
		coordinates: {
			lat: number;
			long: number;
		};
	}): Promise<void>;

	getNearbyVendors(request: {
		bounds: {
			ne: {
				lat: number;
				long: number;
			};
			sw: {
				lat: number;
				long: number;
			};
		};
	}): Promise<VendorLocation[]>;
}

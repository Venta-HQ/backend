import { z } from 'zod';
import {
	GrpcLocationSchema,
	GrpcLocationUpdateSchema,
	GrpcVendorLocationRequestSchema,
	LocationDataSchema,
	LocationUpdateDataSchema,
	UpdateUserLocationDataSchema,
	VendorLocationUpdateDataSchema,
} from '../location.schemas';

export namespace Location {
	export namespace Core {
		export type Location = z.infer<typeof LocationDataSchema>;
		export type LocationUpdate = {
			entityId: string;
			coordinates: {
				lat: number;
				long: number;
			};
		};
		export type VendorLocationUpdate = z.infer<typeof VendorLocationUpdateDataSchema>;
		export type UserLocationUpdate = z.infer<typeof UpdateUserLocationDataSchema>;
	}

	export namespace Contracts {
		export type Location = z.infer<typeof GrpcLocationSchema>;
		export type LocationUpdate = z.infer<typeof GrpcLocationUpdateSchema>;
		export type VendorLocationRequest = {
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
		};

		export interface GeolocationService {
			updateVendorLocation(request: {
				entityId: string;
				coordinates: {
					lat: number;
					long: number;
				};
			}): Promise<void>;

			getNearbyVendors(request: VendorLocationRequest): Promise<Internal.VendorLocation[]>;
		}
	}

	export namespace Internal {
		export type Coordinates = {
			lat: number;
			long: number;
		};

		export type VendorLocation = {
			vendorId: string;
			coordinates: Coordinates;
		};

		export type LocationBounds = {
			ne: Coordinates;
			sw: Coordinates;
		};
	}
}

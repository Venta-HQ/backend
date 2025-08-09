import { z } from 'zod';
import {
	GeoMemberSchema as BaseGeoMemberSchema,
	GeospatialQuerySchema as BaseGeospatialQuerySchema,
	GrpcLocationSchema as BaseGrpcLocationSchema,
	GrpcLocationUpdateSchema as BaseGrpcLocationUpdateSchema,
	GrpcVendorLocationRequestSchema as BaseGrpcVendorLocationRequestSchema,
	LocationDataSchema as BaseLocationDataSchema,
	LocationUpdateDataSchema as BaseLocationUpdateDataSchema,
	UpdateUserLocationDataSchema as BaseUpdateUserLocationDataSchema,
	VendorLocationRequestSchema as BaseVendorLocationRequestSchema,
	VendorLocationUpdateDataSchema as BaseVendorLocationUpdateDataSchema,
} from '../location.schemas';

export namespace Location {
	export namespace Core {
		export type Location = z.infer<typeof BaseLocationDataSchema>;
		export type LocationUpdate = {
			entityId: string;
			coordinates: {
				lat: number;
				long: number;
			};
		};
		export type VendorLocationUpdate = z.infer<typeof BaseVendorLocationUpdateDataSchema>;
		export type UserLocationUpdate = z.infer<typeof BaseUpdateUserLocationDataSchema>;
		export type Coordinates = {
			lat: number;
			long: number;
		};
		export type VendorLocation = {
			entityId: string;
			coordinates: Coordinates;
			updatedAt: string;
			isActive: boolean;
		};
	}

	export namespace Contracts {
		export type Location = z.infer<typeof BaseGrpcLocationSchema>;
		export type LocationUpdate = z.infer<typeof BaseGrpcLocationUpdateSchema>;
		export type VendorLocationRequest = z.infer<typeof BaseVendorLocationRequestSchema>;
		export type GeospatialQuery = z.infer<typeof BaseGeospatialQuerySchema>;

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

		export type GeoMember = z.infer<typeof BaseGeoMemberSchema>;
	}

	export namespace Validation {
		export const LocationSchema = BaseLocationDataSchema;
		export const LocationUpdateSchema = BaseLocationUpdateDataSchema;
		export const VendorLocationUpdateSchema = BaseVendorLocationUpdateDataSchema;
		export const UserLocationUpdateSchema = BaseUpdateUserLocationDataSchema;
		export const GrpcLocationSchema = BaseGrpcLocationSchema;
		export const GrpcLocationUpdateSchema = BaseGrpcLocationUpdateSchema;
		export const GrpcVendorLocationRequestSchema = BaseGrpcVendorLocationRequestSchema;
		export const GeoMemberSchema = BaseGeoMemberSchema;
		export const GeospatialQuerySchema = BaseGeospatialQuerySchema;
		export const VendorLocationRequestSchema = BaseVendorLocationRequestSchema;
	}
}

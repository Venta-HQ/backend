import { AppError, ErrorCodes } from '@app/nest/errors';
import { LocationServices } from '@domains/location-services/contracts/types/context-mapping.types';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Maps vendor location data from marketplace domain to location services domain
 */
export function toLocationVendorLocation(
	data: Marketplace.Core.VendorLocationUpdate,
): LocationServices.Location.Core.VendorLocationUpdate {
	if (!data.location) {
		throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
			vendorId: data.vendorId,
			message: 'Location data is required',
		});
	}

	return {
		vendorId: data.vendorId,
		lat: data.location.lat,
		long: data.location.long,
	};
}

/**
 * Maps user location data from marketplace domain to location services domain
 */
export function toLocationUserLocation(
	data: Marketplace.Core.UserLocation,
): LocationServices.Location.Core.UserLocationUpdate {
	if (!data) {
		throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
			message: 'Location data is required',
		});
	}

	return {
		userId: data.userId,
		neLocation: {
			lat: data.lat,
			long: data.long,
		},
		swLocation: {
			lat: data.lat,
			long: data.long,
		},
	};
}

/**
 * Maps geospatial bounds from marketplace domain to location services domain
 */
export function toLocationGeospatialBounds(
	data: Marketplace.Core.LocationBounds,
): LocationServices.Location.Contracts.VendorLocationRequest {
	if (!data.neBounds || !data.swBounds) {
		throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
			message: 'Both neBounds and swBounds are required',
		});
	}

	return {
		neLocation: {
			lat: data.neBounds.lat,
			long: data.neBounds.long,
		},
		swLocation: {
			lat: data.swBounds.lat,
			long: data.swBounds.long,
		},
	};
}

/**
 * Maps vendor location data from location services domain to marketplace domain
 */
export function fromLocationVendorLocation(
	data: LocationServices.Location.Internal.VendorLocation,
): Marketplace.Core.VendorLocation {
	return {
		vendorId: data.vendorId,
		lat: data.coordinates.lat,
		long: data.coordinates.long,
		updatedAt: new Date().toISOString(),
	};
}

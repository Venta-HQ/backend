import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { LocationServices } from '../types/context-mapping.types';

/**
 * Maps vendor location data from location services domain to marketplace domain
 */
export function toMarketplaceVendorLocation(
	data: LocationServices.Location.Core.VendorLocationUpdate,
): Marketplace.Core.VendorLocation {
	return {
		vendorId: data.vendorId,
		lat: data.lat,
		long: data.long,
		updatedAt: new Date().toISOString(),
	};
}

/**
 * Maps user location data from location services domain to marketplace domain
 */
export function toMarketplaceUserLocation(
	data: LocationServices.Location.Core.UserLocationUpdate,
): Marketplace.Core.UserLocation {
	if (!data.neLocation || !data.swLocation) {
		throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
			message: 'Both neLocation and swLocation are required',
		});
	}

	// For user location, we use the center point between neLocation and swLocation
	const lat = (data.neLocation.lat + data.swLocation.lat) / 2;
	const long = (data.neLocation.long + data.swLocation.long) / 2;

	return {
		userId: data.userId || '',
		lat,
		long,
		updatedAt: new Date().toISOString(),
	};
}

/**
 * Maps geospatial bounds from location services domain to marketplace domain
 */
export function toMarketplaceGeospatialBounds(
	data: LocationServices.Location.Contracts.VendorLocationRequest,
): Marketplace.Core.LocationBounds {
	if (!data.bounds || !data.bounds.sw || !data.bounds.ne) {
		throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
			message: 'Both neLocation and swLocation are required',
		});
	}

	return {
		ne: {
			lat: data.bounds.ne.lat,
			long: data.bounds.ne.long,
		},
		sw: {
			lat: data.bounds.sw.lat,
			long: data.bounds.sw.long,
		},
	};
}

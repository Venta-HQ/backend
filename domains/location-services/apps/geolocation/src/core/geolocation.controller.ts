import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import {
	Empty,
	GeolocationServiceController,
	LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME,
	LocationUpdate,
	VendorLocationRequest,
	VendorLocationResponse,
} from '@app/proto/location-services/geolocation';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GeolocationService } from './geolocation.service';

/**
 * gRPC controller for geolocation service
 * Implements the service interface generated from proto/location-services/geolocation.proto
 */
@Controller()
export class GeolocationController implements GeolocationServiceController {
	private readonly logger = new Logger(GeolocationController.name);

	constructor(private readonly geolocationService: GeolocationService) {}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME, 'updateVendorLocation')
	async updateVendorLocation(request: LocationUpdate): Promise<Empty> {
		this.logger.debug('Handling vendor location update', {
			location: `${request.location?.lat}, ${request.location?.long}`,
			vendorId: request.entityId,
		});

		try {
			await this.geolocationService.updateVendorLocation(request);
			return {};
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				location: request.location,
				vendorId: request.entityId,
			});

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.LOCATION_UPDATE_FAILED, 'Failed to update vendor location', {
				vendorId: request.entityId,
			});
		}
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME, 'vendorLocations')
	async vendorLocations(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		this.logger.debug('Getting vendor locations in area', {
			neBounds: `${request.neLocation?.lat}, ${request.neLocation?.long}`,
			swBounds: `${request.swLocation?.lat}, ${request.swLocation?.long}`,
		});

		try {
			const vendors = await this.geolocationService.getVendorsInArea({
				neBounds: request.neLocation!,
				swBounds: request.swLocation!,
			});

			return { vendors };
		} catch (error) {
			this.logger.error('Failed to get vendor locations', {
				error: error.message,
				neBounds: request.neLocation,
				swBounds: request.swLocation,
			});

			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.LOCATION_QUERY_FAILED,
				'Failed to get vendor locations in area',
				{
					neBounds: request.neLocation,
					swBounds: request.swLocation,
				},
			);
		}
	}
}

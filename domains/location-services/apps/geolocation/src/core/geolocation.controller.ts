import { AppError, ErrorCodes } from '@app/nest/errors';
import { LocationServices } from '@domains/location-services/contracts/types/context-mapping.types';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GeolocationService } from './geolocation.service';

/**
 * gRPC controller for geolocation operations
 */
@Controller()
export class GeolocationController {
	private readonly logger = new Logger(GeolocationController.name);

	constructor(private readonly geolocationService: GeolocationService) {}

	@GrpcMethod('GeolocationService', 'UpdateVendorLocation')
	async updateVendorLocation(request: LocationServices.Contracts.LocationUpdate): Promise<void> {
		this.logger.debug('Handling vendor location update request', {
			entityId: request.entityId,
			coordinates: request.coordinates,
		});

		try {
			await this.geolocationService.updateVendorLocation(request);
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				entityId: request.entityId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('LOCATION_UPDATE_FAILED', 'Failed to update vendor location', {
				entityId: request.entityId,
				error: error.message,
			});
		}
	}

	@GrpcMethod('GeolocationService', 'GetVendorsInArea')
	async getVendorsInArea(
		request: LocationServices.Contracts.GeospatialQuery,
	): Promise<{ vendors: LocationServices.Core.VendorLocation[] }> {
		this.logger.debug('Handling geospatial query request', {
			bounds: request.bounds,
			limit: request.limit,
			activeOnly: request.activeOnly,
		});

		try {
			const vendors = await this.geolocationService.getVendorsInArea(request);
			return { vendors };
		} catch (error) {
			this.logger.error('Failed to get vendors in area', {
				error: error.message,
				bounds: request.bounds,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('LOCATION_QUERY_FAILED', 'Failed to get vendors in area', {
				bounds: request.bounds,
				error: error.message,
			});
		}
	}
}

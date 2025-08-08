import { AppError, ErrorCodes } from '@app/nest/errors';
import { GrpcAuthGuard } from '@app/nest/guards';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { LocationServices } from '@domains/location-services/contracts/types/context-mapping.types';
import { Controller, Logger, UseGuards, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GeolocationService } from './geolocation.service';

@Controller()
@UseGuards(GrpcAuthGuard)
export class GeolocationController {
	private readonly logger = new Logger(GeolocationController.name);

	constructor(private readonly geolocationService: GeolocationService) {}

	@GrpcMethod('GeolocationService', 'UpdateVendorLocation')
	@UsePipes(new SchemaValidatorPipe(LocationServices.Validation.LocationUpdateSchema))
	async updateVendorLocation(request: LocationServices.Contracts.LocationUpdate) {
		this.logger.debug('Handling vendor location update request', {
			entityId: request.entityId,
			coordinates: request.coordinates,
		});

		try {
			await this.geolocationService.updateVendorLocation(request);
			return { success: true };
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error instanceof Error ? error.message : 'Unknown error',
				entityId: request.entityId,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_LOC_UPDATE, {
				operation: 'update_vendor_location',
				entityId: request.entityId,
			});
		}
	}

	@GrpcMethod('GeolocationService', 'GetNearbyVendors')
	@UsePipes(new SchemaValidatorPipe(LocationServices.Validation.GeospatialQuerySchema))
	async getNearbyVendors(request: LocationServices.Contracts.GeospatialQuery) {
		this.logger.debug('Handling nearby vendors request', {
			bounds: request.bounds,
			limit: request.limit,
		});

		try {
			return await this.geolocationService.getNearbyVendors(request);
		} catch (error) {
			this.logger.error('Failed to get nearby vendors', {
				error: error instanceof Error ? error.message : 'Unknown error',
				bounds: request.bounds,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_LOC_QUERY, {
				operation: 'get_nearby_vendors',
				bounds: request.bounds,
			});
		}
	}
}

import { Controller, Logger, UseGuards, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LocationServices } from '@venta/domains/location-services/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { GeolocationService } from './geolocation.service';

@Controller()
@UseGuards(GrpcAuthGuard)
export class GeolocationController {
	private readonly logger = new Logger(GeolocationController.name);

	constructor(private readonly geolocationService: GeolocationService) {}

	@GrpcMethod('GeolocationService', 'UpdateVendorLocation')
	@UsePipes(new SchemaValidatorPipe(LocationServices.Location.Validation.LocationUpdateSchema))
	async updateVendorLocation(request: LocationServices.Location.Core.LocationUpdate) {
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

			throw AppError.internal(ErrorCodes.ERR_LOC_UPDATE_FAILED, {
				operation: 'update_vendor_location',
				entityId: request.entityId,
			});
		}
	}

	@GrpcMethod('GeolocationService', 'GetNearbyVendors')
	@UsePipes(new SchemaValidatorPipe(LocationServices.Location.Validation.VendorLocationRequestSchema))
	async getNearbyVendors(request: LocationServices.Location.Contracts.VendorLocationRequest) {
		this.logger.debug('Handling nearby vendors request', {
			bounds: request.bounds,
		});

		try {
			return await this.geolocationService.getNearbyVendors(request);
		} catch (error) {
			this.logger.error('Failed to get nearby vendors', {
				error: error instanceof Error ? error.message : 'Unknown error',
				bounds: request.bounds,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_LOC_QUERY_FAILED, {
				operation: 'get_nearby_vendors',
				bounds: request.bounds,
			});
		}
	}
}

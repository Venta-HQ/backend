import { GrpcLocationUpdateSchema, GrpcVendorLocationRequestSchema } from '@app/apitypes/lib/location/location.schemas';
import { AppError, ErrorCodes } from '@app/errors';
import {
	LOCATION_SERVICE_NAME,
	LocationUpdate,
	VendorLocationRequest,
	VendorLocationResponse,
} from '@app/proto/location';
import { SchemaValidatorPipe } from '@app/validation';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LocationService } from './location.service';

@Controller()
export class LocationController {
	private readonly logger = new Logger(LocationController.name);

	constructor(private readonly locationService: LocationService) {}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcLocationUpdateSchema))
	async updateVendorLocation(data: LocationUpdate): Promise<any> {
		try {
			await this.locationService.updateLocation(data);
			return { success: true };
		} catch (e) {
			this.logger.error(`Error updating location with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update location' });
		}
	}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorLocationRequestSchema))
	async vendorLocations(data: VendorLocationRequest): Promise<VendorLocationResponse> {
		try {
			// TODO: Implement actual vendor location lookup logic
			return { vendors: [] };
		} catch (e) {
			this.logger.error(`Error getting vendor locations with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'get vendor locations' });
		}
	}
}

import { GrpcLocationUpdateSchema, GrpcVendorLocationRequestSchema } from '@app/apitypes/lib/location/location.schemas';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import {
	LOCATION_SERVICE_NAME,
	LocationUpdateData,
	LocationUpdateResponse,
	VendorLocationRequest,
	VendorLocationResponse,
} from '@app/proto/location';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LocationService } from './location.service';

@Controller()
export class LocationController {
	private readonly logger = new Logger(LocationController.name);

	constructor(private readonly locationService: LocationService) {}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcLocationUpdateSchema))
	async updateLocation(data: LocationUpdateData): Promise<LocationUpdateResponse> {
		try {
			const location = await this.locationService.updateLocation(data);
			return { location };
		} catch (e) {
			this.logger.error(`Error updating location with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update location' });
		}
	}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorLocationRequestSchema))
	async getVendorLocation(data: VendorLocationRequest): Promise<VendorLocationResponse> {
		try {
			const location = await this.locationService.getVendorLocation(data.vendorId);
			return { location };
		} catch (e) {
			this.logger.error(`Error getting vendor location with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'get vendor location' });
		}
	}
}

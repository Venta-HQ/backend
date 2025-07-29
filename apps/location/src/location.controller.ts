import {
	GrpcLocationCreateDataSchema,
	GrpcLocationLookupDataSchema,
	GrpcLocationUpdateDataSchema,
} from '@app/apitypes/lib/location/location.schemas';
import { AppError, ErrorCodes } from '@app/errors';
import {
	LOCATION_SERVICE_NAME,
	LocationCreateData,
	LocationCreateResponse,
	LocationLookupByIdResponse,
	LocationLookupData,
	LocationUpdateData,
	LocationUpdateResponse,
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
	@UsePipes(new SchemaValidatorPipe(GrpcLocationUpdateDataSchema))
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

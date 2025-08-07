import { GrpcLocationUpdateSchema, GrpcVendorLocationRequestSchema } from '@app/apitypes';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import {
	Empty,
	LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME,
	LocationUpdate,
	VendorLocationRequest,
	VendorLocationResponse,
} from '@app/proto/location-services/geolocation';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LocationService } from './location.service';

@Controller()
export class LocationController {
	private readonly logger = new Logger(LocationController.name);

	constructor(private readonly locationService: LocationService) {}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcLocationUpdateSchema))
	async updateVendorLocation(data: LocationUpdate): Promise<Empty> {
		this.logger.log(`Updating vendor location for vendor: ${data.entityId}`);
		await this.locationService.updateVendorLocation(data);
		return {};
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorLocationRequestSchema))
	async vendorLocations(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		this.logger.log(`Searching vendor locations in bounding box`);
		return await this.locationService.searchVendorLocations(request);
	}
}

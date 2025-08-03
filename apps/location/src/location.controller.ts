import {
	Empty,
	LOCATION_SERVICE_NAME,
	LocationUpdate,
	VendorLocationRequest,
	VendorLocationResponse,
} from '@app/proto/location';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LocationService } from './location.service';

@Controller()
export class LocationController {
	constructor(private readonly locationService: LocationService) {}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	async updateVendorLocation(data: LocationUpdate): Promise<Empty> {
		await this.locationService.updateVendorLocation(data);
		return {};
	}

	@GrpcMethod(LOCATION_SERVICE_NAME)
	async vendorLocations(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		return await this.locationService.searchVendorLocations(request);
	}
}

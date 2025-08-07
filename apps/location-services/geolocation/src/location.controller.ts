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
import { LocationTrackingService } from './location-tracking.service';
import { LocationService } from './location.service';

@Controller()
export class LocationController {
	private readonly logger = new Logger(LocationController.name);

	constructor(
		private readonly locationService: LocationService,
		private readonly locationTrackingService: LocationTrackingService,
	) {}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcLocationUpdateSchema))
	async updateVendorLocation(data: LocationUpdate): Promise<Empty> {
		this.logger.log(`Updating vendor location for vendor: ${data.entityId}`, { vendorId: data.entityId });

		// Use the new domain service for enhanced functionality
		if (data.location) {
			await this.locationTrackingService.updateVendorLocation(data.entityId, {
				lat: data.location.lat,
				lng: data.location.long,
			});
		}

		return {};
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorLocationRequestSchema))
	async vendorLocations(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		this.logger.log(`Searching vendor locations in bounding box`, {
			neLocation: request.neLocation,
			swLocation: request.swLocation,
		});
		return await this.locationService.searchVendorLocations(request);
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcLocationUpdateSchema))
	async updateUserLocation(data: LocationUpdate): Promise<Empty> {
		this.logger.log(`Updating user location for user: ${data.entityId}`, { userId: data.entityId });

		if (data.location) {
			await this.locationTrackingService.updateUserLocation(data.entityId, {
				lat: data.location.lat,
				lng: data.location.long,
			});
		}

		return {};
	}
}

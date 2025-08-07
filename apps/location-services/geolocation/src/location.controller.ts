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
		this.logger.log(`Updating vendor location for vendor: ${data.entityId}`);

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
		this.logger.log(`Searching vendor locations in bounding box`);
		return await this.locationService.searchVendorLocations(request);
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcLocationUpdateSchema))
	async updateUserLocation(data: LocationUpdate): Promise<Empty> {
		this.logger.log(`Updating user location for user: ${data.entityId}`);

		if (data.location) {
			await this.locationTrackingService.updateUserLocation(data.entityId, {
				lat: data.location.lat,
				lng: data.location.long,
			});
		}

		return {};
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	async findNearbyVendors(request: { lat: number; lng: number; radius?: number; userId?: string }): Promise<{
		query: { lat: number; lng: number; radius: number };
		searchId: string;
		vendors: Array<{ distance?: number; id: string; location: { lat: number; lng: number } }>;
	}> {
		this.logger.log(`Finding nearby vendors for location: (${request.lat}, ${request.lng})`);

		const result = await this.locationTrackingService.findNearbyVendors(
			{ lat: request.lat, lng: request.lng },
			request.radius || 5000,
			request.userId,
		);

		return {
			query: result.query,
			searchId: result.searchId,
			vendors: result.vendors,
		};
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	async getVendorLocation(request: { vendorId: string }): Promise<{
		location?: { lat: number; lng: number };
	}> {
		this.logger.log(`Getting vendor location for vendor: ${request.vendorId}`);

		const location = await this.locationTrackingService.getVendorLocation(request.vendorId);

		return {
			location: location ? { lat: location.lat, lng: location.lng } : undefined,
		};
	}

	@GrpcMethod(LOCATION_SERVICES_GEOLOCATION_PACKAGE_NAME)
	async removeVendorLocation(request: { vendorId: string }): Promise<Empty> {
		this.logger.log(`Removing vendor location for vendor: ${request.vendorId}`);

		await this.locationTrackingService.removeVendorLocation(request.vendorId);

		return {};
	}
}

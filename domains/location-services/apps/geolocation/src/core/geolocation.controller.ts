import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GeospatialQueryACL, LocationUpdateACL } from '@venta/domains/location-services/contracts';
import type {
	GeospatialQuery,
	LocationResult,
	LocationUpdate,
} from '@venta/domains/location-services/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GeolocationService } from './geolocation.service';

@Controller()
export class GeolocationController {
	private readonly logger = new Logger(GeolocationController.name);

	constructor(private readonly geolocationService: GeolocationService) {}

	@GrpcMethod('GeolocationService', 'UpdateVendorLocation')
	async updateVendorLocation(request: any) {
		// Transform gRPC request to domain using ACL
		const domainRequest: LocationUpdate = LocationUpdateACL.toDomain(request);

		this.logger.debug('Handling vendor location update request', {
			entityId: domainRequest.entityId,
			entityType: domainRequest.entityType,
			coordinates: domainRequest.coordinates,
		});

		try {
			await this.geolocationService.updateVendorLocation(domainRequest);
			return { success: true };
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error instanceof Error ? error.message : 'Unknown error',
				entityId: domainRequest.entityId,
				entityType: domainRequest.entityType,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_vendor_location',
				entityId: request.entityId,
			});
		}
	}

	@GrpcMethod('GeolocationService', 'GetNearbyVendors')
	async getNearbyVendors(request: any): Promise<LocationResult[]> {
		// Transform gRPC request to domain using ACL
		const domainRequest: GeospatialQuery = GeospatialQueryACL.toDomain(request);

		this.logger.debug('Handling nearby entities request', {
			center: domainRequest.center,
			radius: domainRequest.radius,
			entityType: domainRequest.entityType,
		});

		try {
			return await this.geolocationService.getNearbyVendors(domainRequest);
		} catch (error) {
			this.logger.error('Failed to get nearby entities', {
				error: error instanceof Error ? error.message : 'Unknown error',
				center: domainRequest.center,
				radius: domainRequest.radius,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_QUERY_FAILED, {
				operation: 'get_nearby_vendors',
				bounds: request.bounds,
			});
		}
	}
}

import { Empty } from 'libs/proto/src/lib/shared/common';
import { Controller, OnModuleInit } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GeospatialQueryACL, LocationUpdateACL } from '@venta/domains/location-services/contracts';
import { LocationUpdate } from '@venta/domains/location-services/contracts/types/domain';
import { EventDataMap } from '@venta/eventtypes';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, NatsQueueService } from '@venta/nest/modules';
import {
	GEOLOCATION_SERVICE_NAME,
	VendorLocationRequest,
	VendorLocationResponse,
} from '@venta/proto/location-services/geolocation';
import { computeBoundingCircleFromBounds } from '@venta/utils';
import { CoreService } from './core.service';

@Controller()
export class CoreController implements OnModuleInit {
	constructor(
		private readonly geolocationService: CoreService,
		private readonly logger: Logger,
		private readonly natsQueueService: NatsQueueService,
	) {
		this.logger.setContext(CoreController.name);
	}

	async onModuleInit() {
		this.natsQueueService.subscribeToQueue(
			'location.vendor.location_update_requested',
			'geolocation-workers',
			this.handleLocationUpdateRequested.bind(this),
		);
	}

	async handleLocationUpdateRequested(
		request: EventDataMap['location.vendor.location_update_requested'],
	): Promise<Empty> {
		const domainRequest: LocationUpdate = LocationUpdateACL.toDomain(request);

		this.logger.debug('Handling vendor location update request', {
			vendorId: domainRequest.entityId,
			location: domainRequest.coordinates,
		});

		try {
			await this.geolocationService.updateVendorLocation(domainRequest);
			return;
		} catch (error) {
			this.logger.error('Failed to update vendor location', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				entityId: domainRequest.entityId,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_vendor_location',
				entityId: request.vendorId,
			});
		}
	}

	@GrpcMethod(GEOLOCATION_SERVICE_NAME)
	async vendorLocations(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		const domainRequest = GeospatialQueryACL.toDomain(request);

		this.logger.debug('Handling nearby entities request', {
			ne: domainRequest.ne,
			sw: domainRequest.sw,
		});

		// Compute center and radius using shared utils
		const { center, radiusMeters: radius } = computeBoundingCircleFromBounds(domainRequest.ne, domainRequest.sw);

		try {
			const vendors = await this.geolocationService.getNearbyVendors(center, radius);

			return {
				vendors: vendors.map((vendor) => ({
					vendorId: vendor.entityId,
					coordinates: vendor.coordinates,
				})),
			};
		} catch (error) {
			this.logger.error('Failed to get nearby entities', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				center,
				radius,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_QUERY_FAILED, {
				operation: 'get_nearby_vendors',
				ne: domainRequest.ne,
				sw: domainRequest.sw,
			});
		}
	}
}

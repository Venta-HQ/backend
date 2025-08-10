import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
	VendorCreateACL,
	VendorGeospatialBoundsACL,
	VendorLocationUpdateACL,
	VendorLookupACL,
	VendorUpdateACL,
} from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
import {
	Empty,
	MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
	VendorCreateData,
	VendorIdentityData,
	VendorLocationRequest,
	VendorLocationResponse,
	VendorLocationUpdate,
	VendorLookupResponse,
	VendorManagementServiceController,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@venta/proto/marketplace/vendor-management';
import { LocationService } from '../location/location.service';
import { CoreService } from './core.service';

/**
 * gRPC controller for vendor management service
 * Implements the service interface generated from proto/marketplace/vendor-management.proto
 */
@Controller()
@UseGuards(GrpcAuthGuard)
export class CoreController implements VendorManagementServiceController {
	private readonly logger = new Logger(CoreController.name);

	constructor(
		private readonly coreService: CoreService,
		private readonly locationService: LocationService,
	) {}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'getVendorById')
	async getVendorById(request: VendorIdentityData): Promise<VendorLookupResponse> {
		this.logger.debug('Getting vendor by ID', { vendorId: request.id });

		try {
			// Validate and transform request
			const domainRequest = VendorLookupACL.toDomain(request);

			const vendor = await this.coreService.getVendorById(domainRequest.vendorId);

			if (!vendor) {
				throw AppError.notFound(ErrorCodes.ERR_ENTITY_NOT_FOUND, {
					entityType: 'vendor',
					entityId: request.id,
				});
			}

			return { vendor };
		} catch (error) {
			this.logger.error('Failed to get vendor', {
				error: error.message,
				vendorId: request.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_vendor_by_id',
				vendorId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'createVendor')
	async createVendor(request: VendorCreateData): Promise<VendorIdentityData> {
		this.logger.debug('Creating new vendor', { userId: request.userId });

		try {
			// Validate and transform request
			const domainRequest = VendorCreateACL.toDomain(request);

			const vendorId = await this.coreService.createVendor(domainRequest);
			return { id: vendorId };
		} catch (error) {
			this.logger.error('Failed to create vendor', {
				error: error.message,
				userId: request.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_vendor',
				userId: request.userId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'updateVendor')
	async updateVendor(request: VendorUpdateData): Promise<VendorUpdateResponse> {
		this.logger.debug('Updating vendor', { vendorId: request.id });

		try {
			// Validate and transform request
			const domainRequest = VendorUpdateACL.toDomain(request);

			await this.coreService.updateVendor(domainRequest);
			return { message: 'Vendor updated successfully', success: true };
		} catch (error) {
			this.logger.error('Failed to update vendor', {
				error: error.message,
				vendorId: request.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'update_vendor',
				vendorId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'updateVendorLocation')
	async updateVendorLocation(request: VendorLocationUpdate): Promise<Empty> {
		this.logger.debug('Updating vendor location', {
			location: `${request.coordinates?.lat}, ${request.coordinates?.long}`,
			vendorId: request.vendorId,
		});

		try {
			// Validate and transform request
			const domainRequest = VendorLocationUpdateACL.toDomain(request);

			await this.locationService.updateVendorLocation(domainRequest);
			return {};
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				location: request.coordinates,
				vendorId: request.vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_vendor_location',
				vendorId: request.vendorId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'getVendorsInArea')
	async getVendorsInArea(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		this.logger.debug('Getting vendors in area', {
			neBounds: `${request.ne?.lat}, ${request.ne?.long}`,
			swBounds: `${request.sw?.lat}, ${request.sw?.long}`,
		});

		try {
			// Validate and transform request
			const domainRequest = VendorGeospatialBoundsACL.toDomain(request);

			const vendors = await this.coreService.getVendorsInArea(domainRequest);
			return { vendors };
		} catch (error) {
			this.logger.error('Failed to get vendors in area', {
				error: error.message,
				neBounds: request.ne,
				swBounds: request.sw,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_QUERY_FAILED, {
				operation: 'get_vendors_in_area',
				message: 'Failed to query vendors in area',
			});
		}
	}
}
